const assert = require('assert')
const fs = require('fs').promises
const fileSystem = require('fs')
const stream = require('stream')

const Staccato = { Writable: require('staccato/writable') }
const rescue = require('rescue')

const defaults = require('./defaults')

const noop = require('nop')

// Note that we're only going to rotate every minute even if your rotation limit
// is hit within the minute. We're going to generate a file name where the stamp
// is based on the current minute, so if we get a rotation in the same minute we
// just reopen the existing minute file and continue appending. Not going to
// over-think this.

//
class Writer {
    constructor (destructible, file, options) {
        const _options = defaults(options)
        this._lines = []
        this._suffix = _options.suffix
        this._file = file
        this._notify = noop
        this._staccato = { end: noop }
        this._rotation = _options.rotation
        this._Date = _options.Date
        this.destroyed = false
        destructible.destruct(() => {
            this.destroyed = true
            this._notify.call()
        })
        destructible.durable('write', this._write())
    }

    push (json) {
        assert(!this.destroyed, 'destroyed')
        this._lines.push(JSON.stringify(json))
        this._notify.call()
    }

    async _stat (file) {
        try {
            const stat = await fs.stat(file)
            return stat.size
        } catch (error) {
            rescue(error, [{ code: 'ENOENT' }])
            return 0
        }
    }

    async _rotate () {
        await this._staccato.end()
        const stamp = new Date(this._Date.now())
                    .toISOString()
                    .replace(/[T.:]/g, '-')
                    .replace(/-\d{2}-\d{3}Z$/, '')
        const file = [ this._file, stamp ].concat(this._suffix).join('-')
        this._length = await this._stat(file)
        const stream = fileSystem.createWriteStream(file, { flags: 'a' })
        this._staccato = new Staccato.Writable(stream)
    }

    async _write () {
        await this._rotate()
        for (;;) {
            if (this._lines.length == 0) {
                if (this.destroyed) {
                    break
                }
                await new Promise(resolve => this._notify = resolve)
                continue
            }
            this._lines.push('')
            const buffer = Buffer.from(this._lines.join('\n'))
            this._lines.length = 0
            await this._staccato.write(buffer)
            this._length += buffer.length
            if (this._length > this._rotation) {
                await this._rotate()
            }
        }
        await this._staccato.end()
    }
}

module.exports = Writer
