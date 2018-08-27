var coalesce = require('extant')

var descendent = require('foremost')('descendent')

var Chunk = require('prolific.chunk')
var Acceptor = require('prolific.acceptor')
var Queue = require('prolific.queue')

var createUncaughtExceptionHandler = require('./uncaught')

function Shuttle () {
    this._state = 'created'
}

Shuttle.prototype.start = function (options) {
    if (this._state !== 'created') {
        return
    }
    options || (options = {})
    if (descendent.process.env.PROLIFIC_SUPERVISOR_PROCESS_ID != null) {
        this._state = 'started'
        this._listen(descendent, options)
    } else {
        this._state = 'closed'
    }
}

Shuttle.prototype._listen = function (descendent, options) {
    var now = coalesce(options.Date, Date).now()
    var monitorProcessId = +descendent.process.env.PROLIFIC_SUPERVISOR_PROCESS_ID
    var headerId = 'H/' + descendent.process.pid + '/' +  now
    var streamId = 'S/' + descendent.process.pid + '/' +  now

    descendent.increment()

    if (options.uncaughtException != null) {
        var uncaughtException = this.uncaughtException(options.uncaughtException)
        descendent.process.on('uncaughtException', uncaughtException)
    }

    var queue = new Queue(streamId, descendent.process.stderr)
    this._queue = queue

    // All filtering will be performed by the monitor initially. Until
    // we get a configuration we send everything.
    var sink = require('prolific.resolver').sink
    sink.queue = queue
    sink.acceptor = new Acceptor(true, [])

    this._handlers = { pipe: null, accept: null }

    descendent.once('prolific:pipe', this._handlers.pipe = function (message, handle) {
        queue.setPipe(handle)
    })
    descendent.on('prolific:accept', this._handlers.accept = function (message) {
        sink.acceptor = new Acceptor(message.body.accept, message.body.chain)
        sink.queue.push([{ version: message.body.version }])
    })

    var chunks = []
    chunks.push(new Chunk(headerId, 0, Buffer.from(''), 1))
    var buffer = Buffer.from(JSON.stringify({ pid: descendent.process.pid }) + '\n')
    chunks.push(new Chunk(headerId, 1, buffer, buffer.length))

    descendent.process.stderr.write(Buffer.concat([
        chunks[0].header('aaaaaaaa'), chunks[0].buffer,
        chunks[1].header(chunks[0].checksum), chunks[1].buffer
    ]))

    descendent.up(monitorProcessId, 'prolific:shuttle', headerId)
}

function uncaughtException (shuttle, logger) {
    var handler = createUncaughtExceptionHandler(logger)
    return function (error) {
        shuttle.close()
        handler(error)
        throw error
    }
}

Shuttle.prototype.uncaughtException = function (logger) {
    return uncaughtException(this, logger)
}


Shuttle.prototype.close = function () {
    if (this._state === 'started') {
        this._state = 'closed'
        descendent.removeListener('prolific:pipe', this._handlers.pipe)
        descendent.removeListener('prolific:accept', this._handlers.accept)
        descendent.decrement()
        this._queue.close()
    }
}

Shuttle.filename = module.filename

Shuttle.sink = require('prolific.sink')

module.exports = Shuttle
