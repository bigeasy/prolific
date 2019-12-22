require('prolific.shuttle').create({})

const logger = require('prolific.logger').create('hammer')
const payload = require('./payload.json')

setInterval(() => {
    for (let i = 0; i < 2000; i++) {
        logger.info('hammer', { payload })
    }
}, 100)

setInterval(() => console.log(process.memoryUsage()), 5000)

return

const payloads = []
for (let i = 0; i < 1000 * 64; i++) {
    payloads.push(payload)
}

const time = Date.now()
console.log(JSON.stringify(payloads).length)
console.log(Date.now() - time)

setInterval(() => {
    logger.info('hammer', { payloads })
}, 1)
