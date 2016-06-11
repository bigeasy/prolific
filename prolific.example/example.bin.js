var Shuttle = require('prolific.shuttle')
var Logger = require('prolific.logger')

Shuttle.shuttle(process, 250, Logger.createLogger('prolific.example.messages'))

var logger = Logger.createLogger('prolific.example.messages')
setInterval(function () {
    logger.info('greeting', { hello: 'world' })
}, 1000)
