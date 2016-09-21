var Shuttle = require('prolific.shuttle')
var logger = require('prolific.logger').createLogger('prolific.example.messages')

var shuttle = Shuttle.shuttle(process, logger)

logger.info('hello')
for (var i = 0; i < 1000000; i++) {
    logger.info('count', { count: i })
}
throw new Error
