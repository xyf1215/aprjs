const Listener = require('./entity/listener')
const Around = require('./entity/around')

class Event {
  constructor(name) {
    this.name = name
    this.listeners = []
    this.arounds = []
  }

  listener(conf, fn) {
    this.listeners.push(new Listener(conf, fn))
  }

  around(conf, fn, depend) {
    this.arounds.push(new Around(conf, fn, depend))
    this.discardCache()
  }

  discardCache() {
    this.listeners.forEach(listener => listener.discardCache())
  }

  execute(context, middlewares, globalArounds, needRefreshCache) {
    needRefreshCache && this.discardCache()
    return Promise.all(this.listeners.map(listener => listener.createCallFn(this.arounds.concat(globalArounds))(context, middlewares)))
  }

}

module.exports = Event
