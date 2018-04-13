const apr = require('../../src')

describe('初始化', () => {
  test('框架结构', () => {
    expect(apr).toHaveProperty('events')
    expect(apr).toHaveProperty('on')
    expect(apr).toHaveProperty('emit')
    expect(apr).toHaveProperty('around')
  })

  test('实例化', () => {
    apr.on('save', () => {})
    apr.around('*', ctx => {})
    expect(Object.keys(apr.events).length).toBe(1)
    expect(Object.keys(apr.globalArounds).length).toBe(1)
    apr.reset()
  })
})