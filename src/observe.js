var Dep = require('./dep')
var _utils = require('./utils')
var replace = _utils.replace

module.exports = function observe(value, vm) {
	var ob
	if (value.hasOwnProperty('__ob__')) {
		ob = value.__ob__
	} else {
		ob = new Observer(value)
	}
	if (ob && vm) {
		ob.addVm(vm)
	}
	return vm
}

function Observer(value) {
	this.value = value
	this.dep = new Dep()

	Object.defineProperty(value, '__ob__', {
    value: this,
    enumerable: false,
    writable: true,
    configurable: true
  })

	this.walk(value)
}

Observer.prototype.walk = function (obj) {
	Object.keys(obj).forEach(function (key) {
		this.convert(key, obj[key])
	}, this)
}

Observer.prototype.convert = function (key, value) {
	defineReactive(this.value, key, value)
}

Observer.prototype.addVm = function (vm) {
	(this.vms || (this.vms = [])).push(vm)
}

function defineReactive(obj, key, value) {
	var dep = new Dep()
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function reactiveGetter() {
			if (Dep.target) {
				dep.depend()
			}
			return value
		},
		set: function reactiveSetter(newVal) {
			if (value === newVal) {
				return
			} else {
				value = newVal
				dep.notify()
			}
		}
	})
}