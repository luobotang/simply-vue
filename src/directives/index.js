var model = {
  bind() {
    var self = this
    this.on('input', () => {
      self.set(self.el.value)
    })
  },
  update(value) {
    this.el.value = value
  }
}

var text = {
  bind() {
    // do nothing
  },
  update(value) {
    this.el.textContent = value
  }
}

export default {
  model: model,
  text: text
}