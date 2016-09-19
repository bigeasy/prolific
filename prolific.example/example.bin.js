var Shuttle = require('prolific.shuttle')
var logger = require('prolific.logger').createLogger('prolific.example.messages')

Shuttle.shuttle(process, logger)

setInterval(function () {
    logger.info('greeting', { hello: 'world' })
}, 1000).unref()
