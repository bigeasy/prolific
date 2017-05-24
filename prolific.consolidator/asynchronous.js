var Collector = require('prolific.collector')

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

function Asynchronous (input, processor) {
    var collector = new Collector(true)
    var asynchronous = this
    input.on('data', function (buffer) {
        collector.scan(buffer)
        while (collector.chunks.length) {
            asynchronous._chunk(collector.chunks.shift())
        }
    })
    this._chunkNumber = null
    this._processor = processor
    this._sync = []
}

Asynchronous.prototype.consume = function (chunk) {
    this._sync.push(chunk)
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
    var chunks = this._sync
    while (chunks.length && chunks[0].number <= this._chunkNumber) {
        chunks.shift()
    }
    while (chunks.length) {
        this._chunk(chunks.shift())
    }
}

module.exports = Asynchronous
