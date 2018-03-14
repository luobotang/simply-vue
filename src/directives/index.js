var model = {
  bind: function () {
    var self = this
    this.on('input', function () {
      self.set(self.el.value)
    })
  },
  update: function (value) {
    this.el.value = value
  }
}

var text = {
  bind: function () {
    // do nothing
  },
  update: function (value) {
    this.el.textContent = value
  }
}

export default {
  model: model,
  text: text
}