var Watcher = require('./watcher')

module.exports = Directive

function Directive(descriptor, vm, el) {
	this.vm = vm
	this.el = el
	this.descriptor = descriptor
	this.name = descriptor.name
	this.expression = descriptor.exp
}

Directive.prototype._bind = function () {
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

Directive.prototype.set = function (value) {
	this._watcher.set(value)
}

Directive.prototype.on = function (event, handler) {
	this.el.addEventListener(event, handler, false)
}