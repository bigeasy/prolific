var logger = require('prolific.logger').createLogger('prolific')
var shuttle = require('prolific.shuttle').shuttle(process, logger)
if (process.send) {
    process.send({})
}
process.stderr.write(JSON.stringify(process.env) + '\n')
setTimeout(function () {
    logger.info('foo', {})
    shuttle.close()
}, 250)
