const apr = require('./src')

setTimeout(async () => {
  apr.on('save', ctx => {
    console.log('save')
  })

  try {
    await apr.emit('save')
  } catch (e) {
    console.log(e.message)
  }
})
