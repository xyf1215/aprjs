const Apr = require('../../src')

describe('事件回调', () => {
  test('单个事件', done => {
    const apr = new Apr()
    apr.on('save', {connect: true}, ctx => {
      done()
    })
    apr.emit('save')
  })

  test('多个事件', async () => {
    const apr = new Apr()
    let count = 0
    
    apr.on('save', ctx => {
      count ++
    })
    apr.on('save', ctx => {
      count ++
    })
    await apr.emit('save')
    expect(count).toBe(2)
  })

  test('事件中触发其他事件', async () => {
    const apr = new Apr()
    let count = 0
    
    apr.on('done', ctx => {
      count ++
    })

    apr.on('done', ctx => {
      count ++
    })

    apr.on('done1', ctx => {
      count ++
    })

    apr.on('save', async ctx => {
      await apr.emit('done')
      await apr.emit('done1')
      count ++
    })
    
    await apr.emit('save')
    expect(count).toBe(4)
  })

  test('异步事件', async () => {
    const apr = new Apr()
    apr.on('save', ctx => {
      return new Promise(resolve => {
        setTimeout(() => {
          ctx.resp.res = 1
          resolve()
        }, 200)
      })
    })
    const ctx = await apr.emit('save')
    expect(ctx.resp.res).toBe(1)
  })
})

describe('事件返回值', () => {
  test('单个事件返回值', async () => {
    const apr = new Apr()
    apr.on('save', ctx => {
      ctx.resp.s1 = ctx.req.num + 1
    })
    const ctx = await apr.emit('save', {
      num: 1
    })
    expect(ctx.resp.s1).toBe(2)
  })

  test('多个事件返回值', async () => {
    const apr = new Apr()
    apr.on('save', ctx => {
      ctx.resp.s1 = ctx.req.num + 1
    })
    apr.on('save', ctx => {
      ctx.resp.s2 = ctx.req.num + 2
    })
    const ctx = await apr.emit('save', {
      num: 1
    })
    expect(ctx.resp.s1).toBe(2)
    expect(ctx.resp.s2).toBe(3)
  })
})
