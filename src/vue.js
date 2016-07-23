var modelDirectiveDef = {

}

var htmlDirectiveDef = {

}

function Vue(options) {
	this._init(options)
}

Vue.prototype._init = function (options) {
	this.$options = options
	this._initState()
	this.$mount(options.el)
}

Vue.prototype._initState = function () {
	this._initProp()
	this._initData();
}

Vue.prototype._initProp = function () {
	var options = this.$options
	options.el = document.querySelector(options.el)
}

Vue.prototype._initData = function () {
	var data = this._data = this.$options.data
	Object.keys(this._data).forEach(function (key) {
		this._proxy(key)
	}, this)
	observe(data, this)
}

Vue.prototype._proxy = function (key) {
	var self = this
	Object.defineProperty(self, key, {
		configurable: true,
		enumerable: true,
		get: function proxyGetter() {
			return self._data[key];
		},
		set: function proxySetter(val) {
			self._data[key] = val;
		}
	})
}

Vue.prototype.$mount = function (el) {
	this._compile(el)
}

Vue.prototype._compile = function (el) {
	var original = el
	el = transclude(el)

	compileRoot(el)(this, el)
	compile(el)(this, el)

	replace(original, el)
}


/* compile */


function compileRoot(el, options) {
	return function rootLinkFn(vm, el) {
		// TODO
	}
}

function compile(el, options) {
	var nodeLinkFn = compileNode(el, options)
	var childLinkFn = el.hasChildNodes() ? compileNodeList(el.childNodes, options) : null

	return function compositeLinkFn(vm, el) {
		var childNodes = [].slice.call(el.childNodes)
		linkAndCapture(function compositeLinkCapturer() {
			if (nodeLinkFn) nodeLinkFn(vm, el)
			if (childLinkFn) childLinkFn(vm, childNodes)
		}, vm)
	}
}

function linkAndCapture(linker, vm) {
	var originalDirCount = vm._directives.length
	linker()
	var dirs = vm._directives.slice(originalDirCount)
	dirs.forEach(function (dir) { dir._bind() })
	return dirs
}

function compileNode(node, options) {
	if (node.type === 1) {
		return compileElement(node, options)
	} else if (node.type === 3) {
		return compileTextNode(node, options)
	} else {
		return null
	}
}

function compileNodeList(nodeList, options) {
	var linkFns = []
	var nodeLinkFn, childLinkFn, node
	for (var i = 0, l = nodeList.length; i < l; i++) {
		node = nodeList[i]
		nodeLinkFn = compileNode(node, options)
		childLinkFn = node.hasChildNodes() ? compileNodeList(node.childNodes, options) : null
		linkFns.push(nodeLinkFn, childLinkFn)
	}
	return linkFns.length ? makeChildLinkFn(fns) : null
}

function makeChildLinkFn(linkFns) {
	return function childLinkFn(vm, nodes) {
		var node, nodeLinkFn, childrenLinkFn
		for (var i = 0, n = 0, l = linkFns.length; i < l; n++) {
			node = nodes[n]
			nodeLinkFn = linkFns[i++]
			childrenLinkFn = linkFns[i++]
			if (nodeLinkFn) nodeLinkFn(vm, node)
			if (childrenLinkFn) childrenLinkFn(vm, node)
		}
	}
}

function compileElement(el, options) {
	// 只处理 input[type="text"][v-model]
	if (el.tagName === 'input' && el.hasAttribute('v-model')) {
		return makeNodeLinkFn({
			name: 'model',
			def: modelDirectiveDef
		})
	} else {
		return null
	}
}

function compileTextNode(el, options) {
	var tokens = parseText(node.wholeText)
	if (tokens) {
		var frag = document.createDocumentFragment()
		tokens.forEach(function (token) {
			var el = token.tag ? processTextToken(token, options) : document.createTextNode(token.value)
			frag.appendChild(el)
		})
		return makeTextNodeLinkFn(tokens, frag)
	}
}

function processTextToken(token) {
	// 简化，双向绑定，html 模式
	token.descriptor = {
		name: 'html',
		def: htmlDirectiveDef
	}
}

function makeNodeLinkFn(dir) {
	return function nodeLinkFn(vm, el) {
		vm._bindDir(dir, el)
	}
}

function makeTextNodeLinkFn(tokens, frag) {
	return function textNodeLinkFn(vm, el) {
		var fragClone = frag.cloneNode(true)
		var childNodes = toArray(fragClone.childNodes)
		tokens.forEach(function (token, i) {
			var value = token.value
			if (token.tag) {
				var node = childNodes[i]
				vm._bindDir(token.descriptor, node)
			}
		})
		replace(el, fragClone)
	}
}

/* utils */

function toArray(list) {
	var l = list.length
	var ret = new Array(l)
	while (l--) {
		ret[i] = list[i]
	}
	return ret
} 

function replace(target, el) {
	target.parentNode.replaceChild(el, target)
}