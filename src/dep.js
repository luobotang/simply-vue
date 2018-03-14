var uid = 0

export default function Dep() {
  this.id = uid++
	this.subs = []
}

Dep.target = null

Dep.prototype.addSub = function (sub) {
	this.subs.push(sub)
}

Dep.prototype.depend = function () {
	Dep.target.addDep(this)
}

Dep.prototype.notify = function () {
	this.subs.forEach(function (sub) {
		sub.update()
	})
}