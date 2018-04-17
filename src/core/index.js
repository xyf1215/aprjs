const isFunction = require('lodash/isFunction')
const Event = require('./event')
const Around = require('./entity/around')
const Context = require('./entity/context')

class Apr {
  constructor() {
    this.events = Object.create(null)
    this.globalArounds = []
    this.hasAppendAround = false
    this.middlewares = []
  }

  on(name, conf, fn) {
    if (isFunction(conf)) {
      fn = conf
      conf = {}
    }
    const event = this.getEvent(name, true)
    event.listener(conf, fn)
  }

  around(packName, conf, fn) {
    if (isFunction(conf)) {
      fn = conf
      conf = {}
    }
    if (packName === '*') { // 全局环绕，每个事件都会进入
      this.globalArounds.push(new Around(conf, fn))
      this.hasAppendAround = true
    } else {
      const [name, depend] = packName.split(':')
      const event = this.getEvent(name, true)
      event.around(conf, fn, depend)
    }
  }

  getEvent(name, ensure = false) {
    if (!this.events[name] && ensure) {
      this.events[name] = new Event(name)
    }
    return this.events[name]
  }
  
  emit(name, params) {
    return new Promise(async (resolve, reject) => {
      // console.log(JSON.stringify(this.events))
      // console.log(JSON.stringify(this.globalArounds))
      const event = this.getEvent(name)
      !event && reject()
      const context = new Context(params)
      try {
        await event.execute(context, this.middlewares, this.globalArounds, this.hasAppendAround)
        resolve(context)
      } catch (e) {
        reject(e)
      } finally {
        this.hasAppendAround = false
      }
    })
  }

  reset() {
    this.events = Object.create(null)
    this.globalArounds = []
    this.hasAppendAround = false
    this.middlewares = []
  }
}

module.exports = new Apr()
