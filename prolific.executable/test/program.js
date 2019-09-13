process.stderr.write('make confuse!\n')
const descendent = require('foremost')('descendent')
const children = require('child_process')
const logger = require('prolific.logger').createLogger('prolific')
require('prolific.shuttle').create()
//const interval = setInterval(() => {}, 1000)
//process.on('SIGTERM', () => clearInterval(interval))
try {
    logger.info('foo', {})
} catch (e) {
    console.log(e.stack)
}
process.send({})
//process.stderr.write(JSON.stringify(process.env) + '\n')
process.stderr.write('wait?\n')
const child = children.spawn('node', [ '-e', '1' ])
descendent.addChild(child, null)
process.channel.unref()
child.on('exit', function () {
    setTimeout(function () {
        logger.warn('foo', {})
        logger.warn('bar', {})
        logger.warn('baz', {})
    }, 500)
})
