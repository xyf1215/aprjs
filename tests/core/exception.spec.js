const Apr = require('../../src')

describe('异常处理', () => {
  test('单个事件异常', async () => {
    const apr = new Apr()
    apr.on('save', ctx => {
      throw new Error('error')
    })

    try {
      await apr.emit('save')
    } catch (e) {
      expect(e.message).toEqual('error')
    }
  })

  test('事件中的环绕异常', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', ctx => {
      res.push('save')
    })

    apr.around('save', async (ctx, next) => {
      res.push('start a')
      throw new Error('a error')
      res.push('end a')
    })

    try {
      await apr.emit('save')
    } catch (e) {
      expect(e.message).toEqual('a error')
      expect(res).toEqual(['start a'])
    }
  })

  test('环绕嵌套异常(未触发事件)-1', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', ctx => {
      res.push('save')
    })

    apr.around('save', async function a1(ctx, next) {
      res.push('start a1')
      await next()
      res.push('end a1')
    })

    apr.around('save:a1', async (ctx, next) => {
      res.push('start a')
      throw new Error('a error')
      res.push('end a')
    })

    try {
      await apr.emit('save')
    } catch (e) {
      expect(e.message).toEqual('a error')
      expect(res).toEqual(['start a'])
    }
  })

  test('环绕嵌套异常(未触发事件)-2', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', ctx => {
      res.push('save')
    })

    apr.around('save', async function a1(ctx, next) {
      res.push('start a1')
      throw new Error('a1 error')
      await next()
      res.push('end a1')
    })

    apr.around('save:a1', async (ctx, next) => {
      res.push('start a')
      await next()
      res.push('end a')
    })

    try {
      await apr.emit('save')
    } catch (e) {
      expect(e.message).toEqual('a1 error')
      expect(res).toEqual(['start a', 'start a1'])
    }
  })

  test('环绕嵌套异常(触发事件)-1', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', ctx => {
      res.push('save')
      throw new Error('event error')
    })

    apr.around('save', async function a1(ctx, next) {
      res.push('start a1')
      await next()
      res.push('end a1')
    })

    apr.around('save:a1', async (ctx, next) => {
      res.push('start a')
      await next()
      res.push('end a')
    })

    try {
      await apr.emit('save')
    } catch (e) {
      expect(e.message).toEqual('event error')
      expect(res).toEqual(['start a', 'start a1', 'save'])
    }
  })

  test('环绕嵌套异常(触发事件)-2', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', ctx => {
      res.push('save')
    })

    apr.around('save', async function a1(ctx, next) {
      res.push('start a1')
      await next()
      res.push('end a1')
      throw new Error('a1 error')
    })

    apr.around('save:a1', async (ctx, next) => {
      res.push('start a')
      await next()
      res.push('end a')
    })

    try {
      await apr.emit('save')
    } catch (e) {
      expect(e.message).toEqual('a1 error')
      expect(res).toEqual(['start a', 'start a1', 'save', 'end a1'])
    }
  })

  test('环绕嵌套异常(触发事件)-3', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', ctx => {
      res.push('save')
    })

    apr.around('save', async function a1(ctx, next) {
      res.push('start a1')
      await next()
      res.push('end a1')
    })

    apr.around('save:a1', async (ctx, next) => {
      res.push('start a')
      await next()
      res.push('end a')
      throw new Error('a error')
    })

    try {
      await apr.emit('save')
    } catch (e) {
      expect(e.message).toEqual('a error')
      expect(res).toEqual(['start a', 'start a1', 'save', 'end a1', 'end a'])
    }
  })
  
})