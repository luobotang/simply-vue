import Watcher from './watcher'

export default class Directive {
	constructor(descriptor, vm, el) {
		this.vm = vm
		this.el = el
		this.descriptor = descriptor
		this.name = descriptor.name
		this.expression = descriptor.exp
	}

	_bind() {
		var name = this.name
		var descriptor = this.descriptor
	
		if (this.el && this.el.removeAttribute) {
			this.el.removeAttribute(descriptor.attr || 'v-' + name)
		}
	
		var def = descriptor.def
		this.update = def.update
		this.bind = def.bind
	
		if (this.bind) this.bind()
	
		this._update = function (val) {
			this.update(val)
		}.bind(this)
	
		var watcher = this._watcher = new Watcher(this.vm, this.expression, this._update)
		this.update(watcher.value)
	}

	set(value) {
		this._watcher.set(value)
	}

	on(event, handler) {
		this.el.addEventListener(event, handler, false)
	}
}
