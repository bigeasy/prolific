const byline = require('byline')
const Staccato = { Readable: require('staccato/readable') }
const events = require('events')
const Prolific = { Error: require('prolific.error') }

class Consolidator extends events.EventEmitter {
    constructor (asynchronous, synchronous, queue) {
        super()
        this._exited = false
        this._series = 1
        this._streams = { asynchronous: byline(asynchronous), synchronous: byline(synchronous) }
        asynchronous.on('error', this._error.bind(this, 'asynchronous'))
        synchronous.on('error', this._error.bind(this, 'synchronous'))
        this._readable = {
            asynchronous: new Staccato.Readable(this._streams.asynchronous),
            synchronous: new Staccato.Readable(this._streams.synchronous)
        }
        this._queue = queue
    }

    _error (stream, error) {
        this.emit('error', new Prolific.Error('read', [ error ], { stream }))
    }

    async asynchronous () {
        for await (const line of this._readable.asynchronous) {
            this._queue.push(JSON.parse(line.toString()))
            this._series++
        }
    }

    async synchronous () {
        for await (const line of this._readable.synchronous) {
            this._synchronous(JSON.parse(line.toString()))
        }
        this.exit()
    }

    _synchronous (chunk) {
        this._streams.asynchronous.destroy()
        switch (chunk.method) {
        case 'entries':
            if (chunk.series == this._series) {
                this._series++
                this._queue.push(chunk.entries)
            }
            break
        case 'exit':
            this._exited = true
            this._streams.synchronous.destroy()
            this._queue.push([[{ method: 'exit' }]])
            break
        }
    }

    exit () {
        if (!this._exited) {
            this._synchronous({ method: 'exit' })
        }
    }
}

module.exports = Consolidator
