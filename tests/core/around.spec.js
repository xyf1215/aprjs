const Apr = require('../../src')

describe('环绕', () => {
  test('事件有一个环绕', async () => {
    const apr = new Apr()
    const res = []
    
    apr.on('save', ctx => {
      res.push('process')
      return Promise.resolve()
    })
    
    apr.around('save', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })
    await apr.emit('save')
    expect(res).toEqual(['start', 'process', 'end'])
  })

  test('事件有多个环绕', async () => {
    const apr = new Apr()
    const res = []
    
    apr.on('save', ctx => {
      res.push('process')
      return Promise.resolve()
    })

    apr.around('save', (ctx, next) => {
      setTimeout(async () => {
        res.push('start')
        await next()
        res.push('end')
      }, 200)
    })
    
    apr.around('save', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })
    await apr.emit('save')
    expect(res).toEqual(['start', 'start', 'process', 'end', 'end'])
  })

  test('环绕有一个环绕', async () => {
    const apr = new Apr()
    const res = []
    
    apr.on('save', ctx => {
      res.push('process')
      return Promise.resolve()
    })

    apr.around('save', async function a(ctx, next) {
      res.push('a start')
      await next()
      res.push('a end')
    })
    
    apr.around('save:a', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })
    await apr.emit('save')
    expect(res).toEqual(['start', 'a start', 'process', 'a end', 'end'])
  })

  test('环绕有多个环绕', async () => {
    const apr = new Apr()
    const res = []
    
    apr.on('save', ctx => {
      res.push('process')
      return Promise.resolve()
    })

    apr.around('save', async function a(ctx, next) {
      res.push('a start')
      await next()
      res.push('a end')
    })
    
    apr.around('save:a', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })

    apr.around('save:a', async (ctx, next) => {
      setTimeout(async () => {
        res.push('start')
        await next()
        res.push('end')
      }, 200)
    })
    await apr.emit('save')
    expect(res).toEqual(['start', 'start', 'a start', 'process', 'a end', 'end', 'end'])
  })

  test('单个全局环绕', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', ctx => {
      res.push('save')
    })

    apr.on('done', ctx => {
      res.push('done')
    })

    apr.around('*', async (ctx, next) => {
      res.push('start *')
      await next()
      res.push('end *')
    })
    await apr.emit('save')
    await apr.emit('done')
    expect(res).toEqual(['start *', 'save', 'end *', 'start *', 'done', 'end *'])
  })

  test('多个全局环绕', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', ctx => {
      res.push('save')
    })

    apr.around('*', async (ctx, next) => {
      res.push('start *')
      await next()
      res.push('end *')
    })

    apr.around('*', async (ctx, next) => {
      res.push('start *')
      await next()
      res.push('end *')
    })

    await apr.emit('save')
    expect(res).toEqual(['start *', 'start *', 'save', 'end *', 'end *'])
  })

  test('全局环绕与具体环绕', async () => {
    const apr = new Apr()
    const res = []
    apr.on('save', function saveA(ctx) {
      res.push('save')
    })

    apr.around('save:saveA', async (ctx, next) => {
      res.push('start *')
      await next()
      res.push('end *')
    })

    apr.around('*', async (ctx, next) => {
      res.push('start *')
      await next()
      res.push('end *')
    })

    await apr.emit('save')
    expect(res).toEqual(['start *', 'start *', 'save', 'end *', 'end *'])
  })
})