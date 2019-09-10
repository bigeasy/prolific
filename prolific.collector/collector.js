const assert = require('assert')

const ascension = require('ascension')
const events = require('events')

const sort = ascension([ Number, Number ], entry => [ entry.when, entry.series ])

class Collector extends events.EventEmitter {
    constructor () {
        super()
        this._streams = []
    }

    exit (pid) {
        for (const path in this._streams) {
            const stream = this._streams[path]
            if (stream.path[stream.path.length - 1] === pid) {
                if (stream.queue.length) {
                    this.emit('notice', {
                        level: 'warn', label: 'gap',
                        start: stream.start, path: stream.path
                    })
                }
                delete this._streams[path]
                break
            }
        }
    }

    data (data) {
        const path = data.path.join('/')
        if (this._streams[path] == null) {
            this._streams[path] = {
                start: data.start,
                path: data.path,
                series: 0,
                queue: []
            }
        }
        const stream = this._streams[path]
        assert.equal(stream.start, data.start, 'start time mismatch')
        stream.queue.push(data)
        stream.queue.sort(sort)
        while (stream.queue.length != 0 && stream.series == stream.queue[0].series) {
            stream.series = (stream.series + 1) & 0xffffff
            this.emit('data', stream.queue.shift())
        }
    }
}

module.exports = Collector
