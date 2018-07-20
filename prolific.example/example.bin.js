var Shuttle = require('prolific.shuttle')
var logger = require('prolific.logger').createLogger('prolific.example')

Shuttle.shuttle(process, logger)

setInterval(function () {
    console.log('sending')
    logger.info('greeting', { hello: 'world' })
    logger.info('metric', { metric: true, measure: 1 })
    logger.error('error', { value: 1 })
}, 1000).unref()
