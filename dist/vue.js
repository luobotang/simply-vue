(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Vue = factory());
}(this, (function () { 'use strict';

var model = {
  bind() {
    var self = this;
    this.on('input', () => {
      self.set(self.el.value);
    });
  },
  update(value) {
    this.el.value = value;
  }
};

var text = {
  bind() {
    // do nothing
  },
  update(value) {
    this.el.textContent = value;
  }
};

var directives = {
  model: model,
  text: text
}

function replace(target, el) {
	target.parentNode.replaceChild(el, target);
}

function toArray(list) {
	var l = list.length;
	var ret = new Array(l);
	while (l--) {
		ret[l] = list[l];
	}
	return ret
}

var regTag = /{{([^{}]+)}}/g;

function compile(el, options) {
	var nodeLinkFn = compileNode(el, options);
	var childLinkFn = el.hasChildNodes() ? compileNodeList(el.childNodes, options) : null;

	return function compositeLinkFn(vm, el) {
		var childNodes = [].slice.call(el.childNodes);
		linkAndCapture(function compositeLinkCapturer() {
			if (nodeLinkFn) nodeLinkFn(vm, el);
			if (childLinkFn) childLinkFn(vm, childNodes);
		}, vm);
	}
}

function linkAndCapture(linker, vm) {
	var originalDirCount = vm._directives.length;
	linker();
	var dirs = vm._directives.slice(originalDirCount);
	dirs.forEach(function (dir) { dir._bind(); });
	return dirs
}

function compileNode(node, options) {
	if (node.nodeType === 1) {
		return compileElement(node, options)
	} else if (node.nodeType === 3) {
		return compileTextNode(node, options)
	} else {
		return null
	}
}

function compileNodeList(nodeList, options) {
	var linkFns = [];
	var nodeLinkFn, childLinkFn, node;
	for (var i = 0, l = nodeList.length; i < l; i++) {
		node = nodeList[i];
		nodeLinkFn = compileNode(node, options);
		childLinkFn = node.hasChildNodes() ? compileNodeList(node.childNodes, options) : null;
		linkFns.push(nodeLinkFn, childLinkFn);
	}
	return linkFns.length ? makeChildLinkFn(linkFns) : null
}

function makeChildLinkFn(linkFns) {
	return function childLinkFn(vm, nodes) {
		var node, nodeLinkFn, childrenLinkFn;
		for (var i = 0, n = 0, l = linkFns.length; i < l; n++) {
			node = nodes[n];
			nodeLinkFn = linkFns[i++];
			childrenLinkFn = linkFns[i++];
			if (nodeLinkFn) nodeLinkFn(vm, node);
			if (childrenLinkFn) childrenLinkFn(vm, toArray(node.childNodes));
		}
	}
}

function compileElement(el, options) {
	// 只处理 input[type="text"][v-model]
	if (el.tagName === 'INPUT' && el.hasAttribute('v-model')) {
  	var exp = el.getAttribute('v-model').trim();
		return makeNodeLinkFn({
			name: 'model',
			exp: exp,
			def: directives.model
		})
	} else {
		return null
	}
}

function compileTextNode(node, options) {
	var tokens = parseText(node.wholeText);
	if (tokens) {
		var frag = document.createDocumentFragment();
		tokens.forEach(function (token) {
			var el = token.tag ? processTextToken(token) : document.createTextNode(token.value);
			frag.appendChild(el);
		});
		return makeTextNodeLinkFn(tokens, frag)
	}
}

function processTextToken(token) {
  var el = document.createTextNode(' ');
	// 简化，双向绑定，text 模式
	token.descriptor = {
		name: 'text',
		exp: token.value,
		def: directives.text
	};
	return el
}

function makeNodeLinkFn(dir) {
	return function nodeLinkFn(vm, el) {
		vm._bindDir(dir, el);
	}
}

function makeTextNodeLinkFn(tokens, frag) {
	return function textNodeLinkFn(vm, el) {
		var fragClone = frag.cloneNode(true);
		var childNodes = toArray(fragClone.childNodes);
		tokens.forEach(function (token, i) {
			var value = token.value;
			if (token.tag) {
				var node = childNodes[i];
				vm._bindDir(token.descriptor, node);
			}
		});
		replace(el, fragClone);
	}
}

function parseText(text) {
  if (regTag.test(text)) {
    // just copy from vue, and simplify
    var tokens = [];
    var lastIndex = regTag.lastIndex = 0;
    var match, index, value;

    while (match = regTag.exec(text)) {

      index = match.index;
      // push text token
      if (index > lastIndex) {
        tokens.push({
          value: text.slice(lastIndex, index)
        });
      }

      value = match[1];

      tokens.push({
        tag: true,
        value: value.trim()
      });
      lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
      tokens.push({
        value: text.slice(lastIndex)
      });
    }
    return tokens
  } else {
    return null
  }
}

let uid = 0;

class Dep {
	constructor() {
		this.id = uid++;
		this.subs = [];
	}

	addSub(sub) {
		this.subs.push(sub);
	}

	depend() {
		Dep.target.addDep(this);
	}

	notify() {
		this.subs.forEach((sub) => sub.update());
	}
}

Dep.target = null;

class Observer {
	constructor(value) {
		this.value = value;
		this.dep = new Dep();
	
		Object.defineProperty(value, '__ob__', {
			value: this,
			enumerable: false,
			writable: true,
			configurable: true
		});
	
		this.walk(value);
	}

	walk(obj) {
		Object.keys(obj).forEach(function (key) {
			this.convert(key, obj[key]);
		}, this);
	}

	convert(key, value) {
		defineReactive(this.value, key, value);
	}

	addVm(vm) {
		(this.vms || (this.vms = [])).push(vm);
	}
}


function defineReactive(obj, key, value) {
	var dep = new Dep();
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function reactiveGetter() {
			if (Dep.target) {
				dep.depend();
			}
			return value
		},
		set: function reactiveSetter(newVal) {
			if (value === newVal) {
				return
			} else {
				value = newVal;
				dep.notify();
			}
		}
	});
}

function observe(value, vm) {
	var ob;
	if (value.hasOwnProperty('__ob__')) {
		ob = value.__ob__;
	} else {
		ob = new Observer(value);
	}
	if (ob && vm) {
		ob.addVm(vm);
	}
	return vm
}

class Watcher {
  constructor(vm, exp, cb) {
    this.vm = vm;
    vm._watchers.push(this);
    this.exp = exp;
    this.cb = cb;
    this.deps = [];
    this.depIds = {};
  
    this.getter = function (vm) {
      return vm[exp]
    };
    this.setter = function (vm, value) {
      vm[exp] = value;
    };
  
    this.value = this.get();
  }

  get() {
    Dep.target = this;
    var value = this.getter.call(this.vm, this.vm);
    Dep.target = null;
    return value
  }

  set(value) {
    this.setter.call(this.vm, this.vm, value);
  }

  addDep(dep) {
    var id = dep.id;
    if (!this.depIds[id]) {
      dep.addSub(this);
      this.depIds[id] = true;
      this.deps.push(dep);
    }
  }

  update() {
    this.run();
  }

  run() {
    var value = this.get();
    if (this.value !== value) {
      var oldValue = this.value;
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
  }
}

class Directive {
	constructor(descriptor, vm, el) {
		this.vm = vm;
		this.el = el;
		this.descriptor = descriptor;
		this.name = descriptor.name;
		this.expression = descriptor.exp;
	}

	_bind() {
		var name = this.name;
		var descriptor = this.descriptor;
	
		if (this.el && this.el.removeAttribute) {
			this.el.removeAttribute(descriptor.attr || 'v-' + name);
		}
	
		var def = descriptor.def;
		this.update = def.update;
		this.bind = def.bind;
	
		if (this.bind) this.bind();
	
		this._update = function (val) {
			this.update(val);
		}.bind(this);
	
		var watcher = this._watcher = new Watcher(this.vm, this.expression, this._update);
		this.update(watcher.value);
	}

	set(value) {
		this._watcher.set(value);
	}

	on(event, handler) {
		this.el.addEventListener(event, handler, false);
	}
}

class Vue {
	constructor(options) {
		this._init(options);
	}

	_init(options) {
		this.$options = options;
		this._directives = [];
		this._watchers = [];
	
		this._isVue = true;
	
		this._initState();
		this.$mount(options.el);
	}

	_initState() {
		this._initProp();
		this._initData();
	}

	_initProp() {
		var options = this.$options;
		options.el = document.querySelector(options.el);
	}

	_initData() {
		var data = this._data = this.$options.data || {};
		Object.keys(this._data).forEach(function (key) {
			this._proxy(key);
		}, this);
		observe(data, this);
	}

	_proxy(key) {
		var self = this;
		Object.defineProperty(self, key, {
			configurable: true,
			enumerable: true,
			get: function proxyGetter() {
				return self._data[key];
			},
			set: function proxySetter(val) {
				self._data[key] = val;
			}
		});
	}

	$mount(el) {
		this._compile(el);
	}

	_compile(el) {
		compile(el)(this, el);
	}

	_bindDir(descriptor, node) {
		this._directives.push(new Directive(descriptor, this, node));
	}
}

return Vue;

})));
