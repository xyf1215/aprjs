const apr = require('../../src')

describe('事件回调', () => {
  test('单个事件', async () => {
    let done = false
    apr.on('event.single', {connect: true}, async () => {
      done = true
    })
    await apr.emit('event.single')
    expect(done).toBe(true)
  })

  test('多个事件', async () => {
    let count = 0
    apr.on('event.multi', ctx => {
      count ++
    })
    apr.on('event.multi', ctx => {
      count ++
    })
    await apr.emit('event.multi')
    expect(count).toBe(2)
  })

  test('事件中触发其他事件', async () => {
    let count = 0
    apr.on('event.other1', ctx => {
      count ++
    })

    apr.on('event.other1', ctx => {
      count ++
    })

    apr.on('event.other2', ctx => {
      count ++
    })

    apr.on('event.other', async ctx => {
      await apr.emit('event.other1')
      await apr.emit('event.other2')
      count ++
    })
    
    await apr.emit('event.other')
    expect(count).toBe(4)
  })

  test('异步事件', async () => {
    apr.on('event.async', ctx => {
      return new Promise(resolve => {
        setTimeout(() => {
          ctx.resp.res = 1
          resolve()
        }, 200)
      })
    })
    const ctx = await apr.emit('event.async')
    expect(ctx.resp.res).toBe(1)
  })
})

describe('事件返回值', () => {
  test('单个事件返回值', async () => {
    apr.on('event.result', ctx => {
      ctx.resp.s1 = ctx.req.num + 1
    })
    const ctx = await apr.emit('event.result', {
      num: 1
    })
    expect(ctx.resp.s1).toBe(2)
  })

  test('多个事件返回值', async () => {
    apr.on('event.result.multi', ctx => {
      ctx.resp.s1 = ctx.req.num + 1
    })
    apr.on('event.result.multi', ctx => {
      ctx.resp.s2 = ctx.req.num + 2
    })
    const ctx = await apr.emit('event.result.multi', {
      num: 1
    })
    expect(ctx.resp.s1).toBe(2)
    expect(ctx.resp.s2).toBe(3)
  })
})
