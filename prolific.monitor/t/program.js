var logger = require('prolific.logger').createLogger('bigeasy.prolific.test')
require('prolific.shuttle').shuttle(process, 100, logger)
logger.info('hello', {})
process.exit()
