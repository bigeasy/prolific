const assert = require('assert')
const events = require('events')

const { Staccato } = require('staccato')

class Consolidator extends events.EventEmitter {
    constructor (queue, logger) {
        super()
        this._eos = false
        this._series = 0
        this._queue = queue
        this._staccato = { stream: { destroy: () => {} } }
        this._logger = logger
    }

    async asynchronous (socket) {
        socket.on('error', error => this._logger.say('consolidator.socket', { stack: error.stack }))
        this._staccato = new Staccato(socket)
        let remainder = Buffer.alloc(0)
        await Staccato.rescue(async () => {
            READ: for await (const chunk of this._staccato.readable) {
                const buffer = remainder.length == 0 ? chunk : Buffer.concat([ remainder, chunk ])
                let start = 0
                for (;;) {
                    const end = buffer.indexOf(0xa, start)
                    if (~end) {
                        const line = String(buffer.slice(start, end))
                            let json
                            try {
                                json = JSON.parse(line)
                            } catch (error) {
                                assert(error instanceof SyntaxError)
                                this._logger.say('consolidator.json', { line })
                                break READ
                            }
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
                            await this._staccato.writable.write([ JSON.stringify({
                                method: 'receipt',
                                series: json.series
                            }) + '\n' ])
                        start = end + 1
                    } else {
                        remainder = buffer.slice(start)
                        break
                    }
                }
            }
            this._staccato.writable.end()
        })
        await this._staccato.done()
    }

    synchronous (json) {
        this._staccato.stream.destroy()
        if (json == null) {
            this._queue.push(null)
        } else if (json.series == this._series) {
            this._series = (this._series + 1) & 0xffffff
            this._queue.push(json)
        }
    }
}

exports.Consolidator = Consolidator
