var _compile = require('./compile')
var compileRoot = _compile.compileRoot
var compile = _compile.compile
var _utils = require('./utils')
var replace = _utils.replace
var observe = require('./observe')
var Directive = require('./directive')

window.Vue = Vue

function Vue(options) {
	this._init(options)
}

Vue.prototype._init = function (options) {
  this.$options = options
  this._directives = []
  this._watchers = []

  this._isVue = true

	this._initState()
	this.$mount(options.el)
}

Vue.prototype._initState = function () {
	this._initProp()
	this._initData()
}

Vue.prototype._initProp = function () {
	var options = this.$options
	options.el = document.querySelector(options.el)
}

Vue.prototype._initData = function () {
	var data = this._data = this.$options.data || {}
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
	compileRoot(el)(this, el)
	compile(el)(this, el)
}

Vue.prototype._bindDir = function (descriptor, node) {
  this._directives.push(new Directive(descriptor, this, node))
}