const apr = require('../../src')

describe('异常处理', () => {
  test('单个事件异常', async () => {
    apr.on('exception.single', ctx => {
      throw new Error('error')
    })

    try {
      await apr.emit('exception.single')
    } catch (e) {
      expect(e.message).toEqual('error')
    }
  })

  test('事件中的环绕异常', async () => {
    const res = []
    apr.on('exception.around', ctx => {
      res.push('save')
    })

    apr.around('exception.around', async (ctx, next) => {
      res.push('start a')
      throw new Error('a error')
      res.push('end a')
    })

    try {
      await apr.emit('exception.around')
    } catch (e) {
      expect(e.message).toEqual('a error')
      expect(res).toEqual(['start a'])
    }
  })

  test('环绕嵌套异常(未触发事件)-1', async () => {
    const res = []
    apr.on('exception.around.nottouch1', ctx => {
      res.push('save')
    })

    apr.around('exception.around.nottouch1', async function a1(ctx, next) {
      res.push('start a1')
      await next()
      res.push('end a1')
    })

    apr.around('exception.around.nottouch1:a1', async (ctx, next) => {
      res.push('start a')
      throw new Error('a error')
      res.push('end a')
    })

    try {
      await apr.emit('exception.around.nottouch1')
    } catch (e) {
      expect(e.message).toEqual('a error')
      expect(res).toEqual(['start a'])
    }
  })

  test('环绕嵌套异常(未触发事件)-2', async () => {
    const res = []
    apr.on('exception.around.nottouch2', ctx => {
      res.push('save')
    })

    apr.around('exception.around.nottouch2', async function a1(ctx, next) {
      res.push('start a1')
      throw new Error('a1 error')
      await next()
      res.push('end a1')
    })

    apr.around('exception.around.nottouch2:a1', async (ctx, next) => {
      res.push('start a')
      await next()
      res.push('end a')
    })

    try {
      await apr.emit('exception.around.nottouch2')
    } catch (e) {
      expect(e.message).toEqual('a1 error')
      expect(res).toEqual(['start a', 'start a1'])
    }
  })

  test('环绕嵌套异常(触发事件)-1', async () => {
    const res = []
    apr.on('exception.around.touch1', ctx => {
      res.push('save')
      throw new Error('event error')
    })

    apr.around('exception.around.touch1', async function a1(ctx, next) {
      res.push('start a1')
      await next()
      res.push('end a1')
    })

    apr.around('exception.around.touch1:a1', async (ctx, next) => {
      res.push('start a')
      await next()
      res.push('end a')
    })

    try {
      await apr.emit('exception.around.touch1')
    } catch (e) {
      expect(e.message).toEqual('event error')
      expect(res).toEqual(['start a', 'start a1', 'save'])
    }
  })

  test('环绕嵌套异常(触发事件)-2', async () => {
    const res = []
    apr.on('exception.around.touch2', ctx => {
      res.push('save')
    })

    apr.around('exception.around.touch2', async function a1(ctx, next) {
      res.push('start a1')
      await next()
      res.push('end a1')
      throw new Error('a1 error')
    })

    apr.around('exception.around.touch2:a1', async (ctx, next) => {
      res.push('start a')
      await next()
      res.push('end a')
    })

    try {
      await apr.emit('exception.around.touch2')
    } catch (e) {
      expect(e.message).toEqual('a1 error')
      expect(res).toEqual(['start a', 'start a1', 'save', 'end a1'])
    }
  })

  test('环绕嵌套异常(触发事件)-3', async () => {
    const res = []
    apr.on('exception.around.touch3', ctx => {
      res.push('save')
    })

    apr.around('exception.around.touch3', async function a1(ctx, next) {
      res.push('start a1')
      await next()
      res.push('end a1')
    })

    apr.around('exception.around.touch3:a1', async (ctx, next) => {
      res.push('start a')
      await next()
      res.push('end a')
      throw new Error('a error')
    })

    try {
      await apr.emit('exception.around.touch3')
    } catch (e) {
      expect(e.message).toEqual('a error')
      expect(res).toEqual(['start a', 'start a1', 'save', 'end a1', 'end a'])
    }
  })
  
})