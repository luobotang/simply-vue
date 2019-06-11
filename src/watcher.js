import Dep from './dep'

export default class Watcher {
  constructor(vm, exp, cb) {
    this.vm = vm
    vm._watchers.push(this)
    this.exp = exp
    this.cb = cb
    this.deps = []
    this.depIds = {}
  
    this.getter = function (vm) {
      return vm[exp]
    }
    this.setter = function (vm, value) {
      vm[exp] = value
    }
  
    this.value = this.get()
  }

  get() {
    Dep.target = this
    var value = this.getter.call(this.vm, this.vm)
    Dep.target = null
    return value
  }

  set(value) {
    this.setter.call(this.vm, this.vm, value)
  }

  addDep(dep) {
    var id = dep.id
    if (!this.depIds[id]) {
      dep.addSub(this)
      this.depIds[id] = true
      this.deps.push(dep)
    }
  }

  update() {
    this.run()
  }

  run() {
    var value = this.get()
    if (this.value !== value) {
      var oldValue = this.value
      this.value = value
      this.cb.call(this.vm, value, oldValue)
    }
  }
}