process.stderr.write('make confuse!\n')
const children = require('child_process')
const logger = require('prolific.logger').create('prolific')
require('prolific.shuttle').create()
//const interval = setInterval(() => {}, 1000)
//process.on('SIGTERM', () => clearInterval(interval))
try {
    logger.info('foo', {})
} catch (e) {
    console.log(e.stack)
}
//process.stderr.write(JSON.stringify(process.env) + '\n')
process.stderr.write('wait?\n')
const child = children.spawn('node', [ '-e', '1' ])
child.on('exit', function () {
    logger.warn('foo', {})
    logger.warn('bar', {})
    logger.warn('baz', {})
    setTimeout(function () {
        logger.warn('foo', {})
        logger.warn('bar', {})
        logger.warn('baz', {})
    }, 1500)
})
