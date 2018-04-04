class Listener {
  constructor(conf, fn) {
    this.name = fn.name || Symbol('Anonymous')
    this.fn = fn
    this.aroundCache = null
  }

  discardCache() {
    this.aroundCache = null
  }

  getCurrentArounds(depend, arounds) {
    const matcheds = []
    for (let i = 0; i < arounds.length; i ++) {
      const around = arounds[i]
      if (around.depend === depend || around.depend === '*') {
        arounds.splice(i, 1)
        i --
        const children = this.getCurrentArounds(around.name, arounds)
        const matched = {
          around,
          children
        }
        matcheds.push(matched)
      }
    }
    return matcheds
  }

  createCallFn(arounds) {
    return (context, middlewares) => new Promise(async (resolve, reject) => {
      let currentArounds = this.aroundCache
      if (!currentArounds) {
        arounds = [...arounds]
        currentArounds = this.aroundCache = this.getCurrentArounds(this.name, arounds)
      }
      try {
        const signals = await Promise.all(currentArounds.map(({around, children}) => around.createCallFn(context, children)))
        await this.fn(context)
        signals.forEach(signal => signal.forEach(next => next()))
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = Listener
