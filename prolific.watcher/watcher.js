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

    _safeParse (json, eventType, filename) {
        try {
            return JSON.parse(json)
        } catch (error) {
            assert(error instanceof SyntaxError, 'syntax error expected')
            this.emit('notice', {
                level: 'warn', label: 'json',
                directory: this._directory,
                eventType, filename, json
            })
        }
    }

    async _change (shifter) {
        for await (const { eventType, filename } of shifter.iterator()) {
            const hash = /-([0-9a-f]{1,8})\.json$/.exec(filename)
            if (hash == null) {
                this.emit('notice', {
                    level: 'warn', label: 'filename',
                    directory: this._directory,
                    eventType, filename
                })
                continue
            }
            let buffer = null
            try {
                buffer = await fs.readFile(path.resolve(this._directory, filename))
            } catch (error) {
                this.emit('notice', {
                    level: coalesce(LEVEL[error.code], 'warn'),
                    label: 'read',
                    directory: this._directory,
                    eventType, filename, message: error.message, code: error.code
                })
            }
            try {
                await fs.unlink(path.resolve(this._directory, filename))
            } catch (error) {
                this.emit('notice', {
                    level: coalesce(LEVEL[error.code], 'warn'),
                    label: 'unlink',
                    directory: this._directory,
                    eventType, filename, message: error.message, code: error.code
                })
                continue
            }
            const expected = parseInt(hash[1], 16)
            const actual = this._hash.call(null, buffer)
            if (actual != expected) {
                this.emit('notice', {
                    level: 'warn', label: 'checksum',
                    directory: this._directory, eventType, filename,
                    actual: (+actual).toString(16), expected: (+expected).toString(16)
                })
                continue
            }
            const json = this._safeParse(buffer.toString(), eventType, filename)
            if (json != null) {
                this.emit('data', json)
            }
        }
    }
}

module.exports = Watcher
