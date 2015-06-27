var Staccato = require('staccato')
var cadence = require('cadence/redux')

function Queue (out) {
    this._entries = []
    this.out = new Staccato(out, false)
    this.interval = 5
}

Queue.prototype.start = cadence(function (async) {
    this._stop = false

    var previous = Math.floor(Date.now() / 1000) * 1000

    function cancel () {
        if (this._stop) {
            return [ loop ]
        }
    }

    var message
    var loop = async(function () {
        delete this._timer
    }, cancel, function () {

        // a logging message for our log flush.
        message = {
            duration: Date.now()
        }

        // track entries.
        message.entries = this._entries.length

        // Convert gathered entries into a great big string.
        var blob = this._entries.join('')
        this._entries.length = 0

        // track write length.
        message.length = blob.length

        // Write string and wait to drain.
        this.out.write(blob, async())
    }, cancel, function () {
        var start = message.duration
        message.duration = Date.now() - message.duration

        var next = previous + (this.interval * 1000)
        var now = Date.now()
        var offset = next - now

        previous = message.next = next

//      logger.info('pump', 'written', message)

        if (offset < 0) {
            logger.error('pump', 'overflow')
        }

        this._timer = {}
        this._timer.callback = async()
        this._timer.timeout = setTimeout(this._timer.callback, offset)
    })()
   // ^^ forever loop.
})

Queue.prototype.stop = function () {
    this._stop = true
    if (this._timer) {
        this._timer.callback()
    }
}

Queue.prototype.write = function (line) {
    this._entries.push(line)
}
