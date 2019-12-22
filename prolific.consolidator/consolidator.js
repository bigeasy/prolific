const assert = require('assert')
const byline = require('byline')
const Staccato = require('staccato')
const events = require('events')

class Consolidator extends events.EventEmitter {
    constructor (queue, logger) {
        super()
        this._eos = false
        this._series = 0
        this._queue = queue
        this._readable = { destroy: () => {} }
        this._writable = { destroy: () => {} }
        this._logger = logger
    }

    async asynchronous (input, output) {
        this._readable = new Staccato.Readable(input)
        this._writable = new Staccato.Writable(output)
        let remainder = Buffer.alloc(0)
        for await (const chunk of this._readable) {
            const buffer = remainder.length == 0 ? chunk : Buffer.concat([ remainder, chunk ])
            let start = 0
            for (;;) {
                const end = buffer.indexOf(0xa, start)
                if (~end) {
                    const line = buffer.slice(start, end).toString()
                    try {
                        const json = JSON.parse(line)
                        if (json.series == this._series) {
                            this._series = (this._series + 1) & 0xffffff
                        } else {
                            this._logger.say('consolidator.series', {
                                expected: this._series,
                                actual: json.series
                            })
                            this._series = json.series + 1
                        }
                        this._queue.push(json)
                        await this._writable.write(JSON.stringify({
                            method: 'receipt',
                            series: json.series
                        }) + '\n')
                    } catch (error) {
                        assert(error instanceof SyntaxError)
                        this._logger.say('consolidator.json', { line })
                    }
                    start = end + 1
                } else {
                    remainder = buffer.slice(start)
                    break
                }
            }
        }
    }

    synchronous (json) {
        this._readable.destroy()
        this._writable.destroy()
        if (json == null) {
            this._queue.push(null)
        } else if (json.series == this._series) {
            this._series = (this._series + 1) & 0xffffff
            this._queue.push(json)
        }
    }
}

module.exports = Consolidator
