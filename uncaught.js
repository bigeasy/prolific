var abend = require('abend')

module.exports = function (logger, queue, stderr) {
    return function (error) {
        logger.error('uncaught', { stack: error.stack })
        queue.flush(stderr, function (error) {
            abend(error)
            queue.flush(stderr, abend)
        })
    }
}
