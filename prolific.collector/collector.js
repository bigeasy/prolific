const assert = require('assert')

const ascension = require('ascension')
const events = require('events')

const sort = ascension([ Number, Number ], entry => [ entry.when, entry.series ])

class Collector extends events.EventEmitter {
    constructor () {
        super()
        this._streams = []
    }

    data (data) {
        if (this._streams[data.pid] == null) {
            this._streams[data.pid] = {
                start: data.start,
                pid: data.pid,
                series: 0,
                queue: []
            }
        }
        const stream = this._streams[data.pid]
        if (data.body.method == 'eos') {
            if (stream.queue.length) {
                this.emit('notice', {
                    level: 'warn', label: 'gap',
                    start: stream.start, path: stream.path
                })
            }
            this.emit('data', data)
            delete this._streams[data.pid]
        } else {
            assert.equal(stream.start, data.start, 'start time mismatch')
            stream.queue.push(data)
            stream.queue.sort(sort)
            while (stream.queue.length != 0 && stream.series == stream.queue[0].series) {
                stream.series = (stream.series + 1) & 0xffffff
                this.emit('data', stream.queue.shift())
            }
        }
    }
}

module.exports = Collector
