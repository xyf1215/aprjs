const Apr = require('./src')
const apr = new Apr()
const st = setTimeout

st(async () => {

  apr.on('save', ctx => {
    console.log('save')
  })

  try {
    await apr.emit('save')
  } catch (e) {
    console.log(e.message)
  }
})
