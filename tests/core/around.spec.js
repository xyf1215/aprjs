const apr = require('../../src')

describe('事件环绕', () => {
  test('事件有一个环绕', async () => {
    const res = []
    apr.on('around.single', function savePost(ctx) {
      res.push('process')
      return Promise.resolve()
    })
    
    apr.around('around.single:savePost', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })
    await apr.emit('around.single')
    expect(res).toEqual(['start', 'process', 'end'])
  })

  test('事件有多个环绕', async () => {
    const res = []
    
    apr.on('around.multi', ctx => {
      res.push('process')
      return Promise.resolve()
    })

    apr.around('around.multi', (ctx, next) => {
      setTimeout(async () => {
        res.push('start')
        await next()
        res.push('end')
      }, 200)
    })
    
    apr.around('around.multi', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })
    await apr.emit('around.multi')
    expect(res).toEqual(['start', 'start', 'process', 'end', 'end'])
  })

  test('多个事件各有环绕', async () => {
    const res1 = []
    const res2 = []
    
    apr.on('around.multi.each', function savePost(ctx) {
      res1.push('savePost')
      return Promise.resolve()
    })

    apr.on('around.multi.each', function saveTags(ctx) {
      res2.push('saveTags')
      return Promise.resolve()
    })

    apr.around('around.multi.each:savePost', async (ctx, next) => {
      res1.push('start')
      await next()
      res1.push('end')
    })
    
    apr.around('around.multi.each:saveTags', async (ctx, next) => {
      res2.push('start')
      await next()
      res2.push('end')
    })
    await apr.emit('around.multi.each')
    expect(res1).toEqual(['start', 'savePost', 'end'])
    expect(res2).toEqual(['start', 'saveTags', 'end'])
  })
})

describe('环绕有环绕', () => {
  test('环绕有一个环绕-1', async () => {
    const res = []
    
    apr.on('around2', ctx => {
      res.push('process')
      return Promise.resolve()
    })

    apr.around('around2', async function a(ctx, next) {
      res.push('a start')
      await next()
      res.push('a end')
    })
    
    apr.around('around2:a', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })
    await apr.emit('around2')
    expect(res).toEqual(['start', 'a start', 'process', 'a end', 'end'])
  })

  test('环绕有一个环绕-1', async () => {
    const res = []
    
    apr.on('around2.1', ctx => {
      res.push('process')
      return Promise.resolve()
    })

    apr.around('around2.1', async function a(ctx, next) {
      res.push('a start')
      await next()
      res.push('a end')
    })
    
    apr.around('around2.1:a', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })
    await apr.emit('around2.1')
    expect(res).toEqual(['start', 'a start', 'process', 'a end', 'end'])
  })

  test('环绕有一个环绕-2', async () => {
    const res = []
    
    apr.on('around2.2', function savePost(ctx) {
      res.push('process')
      return Promise.resolve()
    })

    apr.around('around2.2:savePost', async function a(ctx, next) {
      res.push('a start')
      await next()
      res.push('a end')
    })
    
    apr.around('around2.2:a', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })
    await apr.emit('around2.2')
    expect(res).toEqual(['start', 'a start', 'process', 'a end', 'end'])
  })

  test('环绕有多个环绕', async () => {
    const res = []
    
    apr.on('around2.multi', ctx => {
      res.push('process')
      return Promise.resolve()
    })

    apr.around('around2.multi', async function a(ctx, next) {
      res.push('a start')
      await next()
      res.push('a end')
    })
    
    apr.around('around2.multi:a', async (ctx, next) => {
      res.push('start')
      await next()
      res.push('end')
    })

    apr.around('around2.multi:a', async (ctx, next) => {
      setTimeout(async () => {
        res.push('start')
        await next()
        res.push('end')
      }, 200)
    })
    await apr.emit('around2.multi')
    expect(res).toEqual(['start', 'start', 'a start', 'process', 'a end', 'end', 'end'])
  })
})

describe('环绕有环绕', () => {
  test('单个全局环绕', async () => {
    const res = []
    apr.on('around.global.single', ctx => {
      res.push('save')
    })

    apr.on('around.global.single2', ctx => {
      res.push('done')
    })

    apr.around('*', async (ctx, next) => {
      res.push('start *')
      await next()
      res.push('end *')
    })
    await apr.emit('around.global.single')
    await apr.emit('around.global.single2')
    expect(res).toEqual(['start *', 'save', 'end *', 'start *', 'done', 'end *'])
  })

  test('多个全局环绕', async () => {
    const res = []
    apr.on('around.global.multi', ctx => {
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

    await apr.emit('around.global.multi')
    expect(res).toEqual(['start *', 'start *', 'save', 'end *', 'end *'])
  })

  test('全局环绕与具体环绕', async () => {
    const res = []
    apr.on('around.global1', function saveA(ctx) {
      res.push('save')
    })

    apr.around('around.global1:saveA', async (ctx, next) => {
      res.push('start *')
      await next()
      res.push('end *')
    })

    apr.around('*', async (ctx, next) => {
      res.push('start *')
      await next()
      res.push('end *')
    })

    await apr.emit('around.global1')
    expect(res).toEqual(['start *', 'start *', 'save', 'end *', 'end *'])
  })
})
