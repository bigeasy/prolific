const logger = require('prolific.logger').createLogger('prolific.shuttle')

module.exports = function (label) {
    return function (error) {
        logger.panic(label, { stack: error.stack })
        throw error
    }
}
