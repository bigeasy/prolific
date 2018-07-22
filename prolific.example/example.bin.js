var Shuttle = require('prolific.shuttle')
var logger = require('prolific.logger').createLogger('prolific.example')

var shuttle = Shuttle.shuttle(process, logger)

process.on('SIGTERM', function () {
    shuttle.close()
})

setInterval(function () {
    console.log('sending')
    console.log(process.memoryUsage())
    logger.info('greeting', { hello: 'world' })
    logger.info('metric', { metric: true, measure: 1 })
    logger.error('error', { value: 1 })
}, 1000).unref()
