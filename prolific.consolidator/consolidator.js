const assert = require('assert')
const byline = require('byline')
const Staccato = require('staccato')
const events = require('events')

class Consolidator extends events.EventEmitter {
    constructor (input, output, queue) {
        super()
        this._eos = false
        this._series = 0
        this._readable = new Staccato.Readable(byline(input))
        this._writable = new Staccato.Writable(output)
        this._queue = queue
    }

    async asynchronous () {
        for await (const line of this._readable) {
            const json = JSON.parse(line.toString())
            assert.equal(json.series, this._series, 'series mismatch')
            this._series = (this._series + 1) & 0xffffff
            this._queue.push(json)
            await this._writable.write(JSON.stringify({ series: json.series }) + '\n')
        }
    }

    synchronous (json) {
        this._readable.destroy()
        this._writable.destroy()
        if (json.series == this._series) {
            this._series = (this._series + 1) & 0xffffff
            this._resumed = true
            this._queue.push(json)
        }
    }

    eos () {
        if (!this._eos) {
            this._eos = true
            this._queue.push({ method: 'eos' })
        }
    }
}

module.exports = Consolidator
