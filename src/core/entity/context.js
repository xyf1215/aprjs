class Context {
  constructor(req) {
    this.req = req
    this.resp = Object.create(null)
  }
}

module.exports = Context