var Collector = require('prolific.collector')
var cadence = require('cadence')
var Staccato = require('staccato')

var LEVEL = {
    trace: 0,
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
// TODO: Fatal.
}

function qualify (value, index, array) {
    return array.slice(0, index + 1).join('.')
}

function process (line) {
    var json = JSON.parse(line)
    var qualifier = json.qualifier.split('.').map(qualify)
    qualifier.unshift(null)
    this._processor.process({
        formatted: [],
        when: json.when,
        qualifier: qualifier,
        level: LEVEL[json.level],
        json: json
    })
}

function Asynchronous (processor) {
    this._chunkNumber = null
    this._processor = processor
    this._sync = []
    this._readable = null
}

Asynchronous.prototype.listen = cadence(function (async, input) {
    var collector = new Collector(true)
    this._readable = new Staccato.Readable(input)
    var loop = async(function () {
        async(function () {
            this._readable.read(async())
        }, function (buffer) {
            if (buffer == null) {
                return [ loop.break ]
            }
            collector.scan(buffer)
            while (collector.chunks.length) {
                this._chunk(collector.chunks.shift())
            }
        })
    })()
})

Asynchronous.prototype.consume = function (chunk) {
    if (chunk.eos) {
        this.exit()
    } else {
        this._sync.push(chunk)
    }
}

Asynchronous.prototype._chunk = function (chunk) {
    this._chunkNumber = chunk.number
    var lines = chunk.buffer.toString().split('\n')
    if (lines[lines.length - 1].length == 0) {
        lines.pop()
    }
    lines.forEach(process, this)
}

Asynchronous.prototype.exit = function () {
    // TODO Must shutdown asynchronous scanning also, kill readable or set flag.
    this._readable.destroy()
    var chunks = this._sync.splice(0, this._sync.length)
    while (chunks.length && chunks[0].number <= this._chunkNumber) {
        chunks.shift()
    }
    while (chunks.length) {
        this._chunk(chunks.shift())
    }
}

module.exports = Asynchronous
