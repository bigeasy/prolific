process.stderr.write('make confuse!\n')
var descendent = require('foremost')('descendent')
var children = require('child_process')
var logger = require('prolific.logger').createLogger('prolific')
var shuttle = require('prolific.shuttle/index')
shuttle.start()
try {
    logger.info('foo', {})
} catch (e) {
    console.log(e.stack)
}
process.send({})
process.stderr.write(JSON.stringify(process.env) + '\n')
process.stderr.write('wait?\n')
var child = children.spawn('node', [ '-e', '1' ])
descendent.addChild(child, null)
child.on('close', function () {
    setTimeout(function () {
        logger.warn('foo', {})
        logger.warn('bar', {})
        shuttle.close()
        logger.warn('baz', {})
    }, 250)
})
