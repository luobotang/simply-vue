import { compileRoot, compile } from './compile'
import observe from './observe'
import Directive from './directive'

export default class Vue {
	constructor(options) {
		this._init(options)
	}

	_init(options) {
		this.$options = options
		this._directives = []
		this._watchers = []
	
		this._isVue = true
	
		this._initState()
		this.$mount(options.el)
	}

	_initState() {
		this._initProp()
		this._initData()
	}

	_initProp() {
		var options = this.$options
		options.el = document.querySelector(options.el)
	}

	_initData() {
		var data = this._data = this.$options.data || {}
		Object.keys(this._data).forEach(function (key) {
			this._proxy(key)
		}, this)
		observe(data, this)
	}

	_proxy(key) {
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

	$mount(el) {
		this._compile(el)
	}

	_compile(el) {
		compileRoot(el)(this, el)
		compile(el)(this, el)
	}

	_bindDir(descriptor, node) {
		this._directives.push(new Directive(descriptor, this, node))
	}
}