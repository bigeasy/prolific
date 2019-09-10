const filesystem = require('fs')
const fs = require('fs').promises
const events = require('events')
const Queue = require('avenue')
const path = require('path')
const assert = require('assert')
const logger = require('prolific.logger').createLogger('prolific')
const coalesce = require('extant')

const LEVEL = { ENOENT: 'debug' }

class Watcher extends events.EventEmitter {
    constructor (destructible, hash, directory) {
        super()
        this._queue = new Queue
        this._hash = hash
        this._directory = directory
        this._watcher = filesystem.watch(directory)
        this._watcher.on('change', (eventType, filename) => {
            this._queue.push({ eventType, filename })
        })
        this._watcher.on('error', this.emit.bind(this, 'error'))
        destructible.durable('change', this._change(this._queue.shifter()))
        destructible.destruct(() => this._watcher.close())
        destructible.destruct(() => this._queue.push(null))
    }

    async _change (shifter) {
        for await (const { eventType, filename } of shifter.iterator()) {
            const hash = /-[0-9a-f]{1,8}\.json$/.exec(filename)
            if (hash == null) {
                logger.warn('filename', { directory: this._directory, eventType, filename })
                continue
            }
            let buffer = null
            try {
                buffer = await fs.readFile(path.resolve(this._directory, filename))
            } catch (error) {
                const level = coalesce(LEVEL[error.code], 'warn')
                logger[level]('read', {
                    directory: this._directory,
                    eventType, filename, message: error.message, code: error.code
                })
            }
            try {
                buffer = await fs.readFile(path.resolve(this._directory, filename))
                await fs.unlink(path.resolve(this._directory, filename))
            } catch (error) {
                const level = coalesce(LEVEL[error.code], 'warn')
                logger[level]('unlink', {
                    directory: this._directory,
                    eventType, filename, message: error.message, code: error.code
                })
                continue
            }
            const expected = parseInt(hash, 16)
            const actual = this._hash.call(null, buffer)
            if (actual != expected) {
                logger.warn('checksum', {
                    directory: this._directory, eventType, filename, actual, expected
                })
            }
            const json = buffer.toString()
            try {
                this.emit('data', JSON.parse(json))
            } catch (error) {
                assert(error instanceof SyntaxError, 'syntax error expected')
                logger.warn('json', {
                    directory: this._directory,
                    eventType, filename, json
                })
            }
        }
    }
}

module.exports = Watcher
