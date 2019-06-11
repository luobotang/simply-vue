let uid = 0

class Dep {
	constructor() {
		this.id = uid++
		this.subs = []
	}

	addSub(sub) {
		this.subs.push(sub)
	}

	depend() {
		Dep.target.addDep(this)
	}

	notify() {
		this.subs.forEach((sub) => sub.update())
	}
}

Dep.target = null

export default Dep
