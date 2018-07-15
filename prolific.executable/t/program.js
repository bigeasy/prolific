var logger = require('prolific.logger').createLogger('prolific')
var shuttle = require('prolific.shuttle').shuttle(process, logger)
if (process.send) {
    process.send({})
}
process.stderr.write(JSON.stringify(process.env) + '\n')
if (process.argv[2]) {
    process.once('SIGTERM', function () {
        shuttle.close()
    })
    // process.once('SIGTERM', function () { process.kill(process.pid) })
    logger.info('foo', {})
} else {
    setTimeout(function () {
        logger.info('foo', {})
        shuttle.close()
    }, 250)
}
