var fs = require('fs')

function Pipe (pipe) {
    this._pipe = pipe
}

Pipe.prototype.start = function (async) {
    var loop = async([ function () {
        this._queue = new Queue(fs.createWriteStream(this._pipe))
        this._queue.start(async())
    }, /^EPIPE$/, function () {
        return [ loop() ]
    }], function () {
        delete this._queue
        return [ loop ]
    })()
}

Pipe.prototype.stop = function () {
    if (this._queue) {
        this._queue.stop()
    }
}

Pipe.prototype._write = function (line) {
    this._queue.write(line)
}
