const rejections = { bad: null, good: null }
const bad = new Promise((_, reject) => rejections.bad = reject)

process.on('unhandledRejection', error => {
    console.log('unhandled', error.message)
})

bad.then(() => console.log('woot'))
bad.catch(() => console.log('bummer'))

const good = new Promise((_, reject) => rejections.good = reject)

good.then(() => console.log('woot')).catch(() => console.log('bummer'))


rejections.bad(new Error('bad'))
rejections.good(new Error('good'))
