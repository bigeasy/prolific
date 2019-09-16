const logger = require('prolific.logger').create('prolific.shuttle')

module.exports = function (label) {
    return function (error) {
        logger.panic(label, { stack: error.stack })
        throw error
    }
}
