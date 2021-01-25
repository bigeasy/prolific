const assert = require('assert')
const byline = require('byline')
const Staccato = require('staccato/redux')
const events = require('events')

class Consolidator extends events.EventEmitter {
    constructor (queue, logger) {
        super()
        this._eos = false
        this._series = 0
        this._queue = queue
        this._readable = { stream: { destroy: () => {} } }
        this._logger = logger
    }

    async asynchronous (input, output) {
        this._readable = new Staccato(input)
        const writable = new Staccato(output)
        let remainder = Buffer.alloc(0)
        READ: for await (const chunk of this._readable.readable) {
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
                        if (! writable.writable.write(JSON.stringify({
                            method: 'receipt',
                            series: json.series
                        }) + '\n')) {
                            await writable.writable.drain()
                        }
                        if (writable.writable.finished) {
                            break READ
                        }
                    } catch (error) {
                        console.log(error.stack)
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
        writable.writable.end()
    }

    synchronous (json) {
        this._readable.stream.destroy()
        if (json == null) {
            this._queue.push(null)
        } else if (json.series == this._series) {
            this._series = (this._series + 1) & 0xffffff
            this._queue.push(json)
        }
    }
}

module.exports = Consolidator
