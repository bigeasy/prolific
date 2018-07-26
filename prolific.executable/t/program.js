var logger = require('prolific.logger').createLogger('prolific')
var shuttle = require('prolific.shuttle').shuttle(process, logger)
try {
    logger.info('foo', {})
} catch (e) {
    console.log(e.stack)
}
process.send({})
process.stderr.write(JSON.stringify(process.env) + '\n')
setTimeout(function () {
    logger.warn('foo', {})
    logger.warn('bar', {})
    shuttle.close()
    logger.warn('baz', {})
}, 250)
