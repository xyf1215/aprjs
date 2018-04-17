const env = require('../../util/env')

class Around {
  constructor(conf, fn, depend = '*') {
    this.name = fn.name || Symbol('Anonymous')
    this.inBrowser = env.inBrowser
    this.fn = fn
    this.depend = depend
  }

  createCallFn(context, children, nextFns = [], childrenNextFns = []) {
    return new Promise(async (resolve, reject) => {
      let next
      const signal = new Promise(r => next = r)
      try {
        if (children.length) {
          childrenNextFns.push(next)
          await Promise.all(children.map(({around, children}) => around.createCallFn(context, children, nextFns, childrenNextFns)))
        } else {
          nextFns.unshift(next)
        }
        await this.fn(context, () => {
          resolve(childrenNextFns.concat(nextFns))
          return signal
        })
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = Around

