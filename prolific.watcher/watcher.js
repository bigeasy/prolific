const filesystem = require('fs')
const fs = require('fs').promises
const events = require('events')
const Queue = require('avenue')
const path = require('path')
const assert = require('assert')
const coalesce = require('extant')

const LEVEL = { ENOENT: 'debug' }

class Watcher extends events.EventEmitter {
    constructor (destructible, hash, directory) {
        super()
        this.destroyed = false
        const paired = new Queue().shifter().paired
        this._queue = paired.queue
        this._hash = hash
        this._pids = []
        this._draining = false
        this._processes = {}
        this._directory = directory
        this._watcher = filesystem.watch(directory)
        this._watcher.on('change', (eventType, filename) => {
            this._queue.push({ method: 'changed', eventType, filename })
        })
        this._watcher.on('error', this.emit.bind(this, 'error'))
        destructible.durable('shift', this._shift(paired.shifter))
        destructible.destruct(() => this.destroyed = true)
        destructible.destruct(() => this._watcher.close())
        destructible.destruct(() => paired.shifter.destroy())
    }

    drain () {
        this._queue.push({ method: 'drain' })
    }

    killed (pid) {
        this._queue.push({ method: 'killed', pid })
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

    async _killed () {
        if (this._pids.length != 0) {
            const dir = await fs.readdir(this._directory)
            const extant = {}
            for (const filename of dir) {
                const pid = /(\d+)-[0-9a-f]{1,8}\.json$/.exec(filename)
                if (pid == null) {
                    this.emit('notice', {
                        level: 'warn', label: 'filename',
                        directory: this._directory, filename, eventType: 'pid'
                    })
                    continue
                }
                extant[pid[1]] = true
            }
            let i = 0, I = this._pids.length
            while (i < I) {
                const pid = this._pids[i]
                if (extant[pid]) {
                    i++
                } else {
                    this._pids.splice(i, 1)
                    I--
                    this.emit('data', { pid, body: { method: 'eos' } })
                }
            }
        }
        if (this._draining) {
            await this._drained()
        }
    }

    async _drained () {
        const dir = await fs.readdir(this._directory)
        if (dir.length == 0 && this._pids.length == 0) {
            this._queue.push(null)
        }
    }

    async _harvest (eventType, filename) {
        await this._killed()
        const hash = /-([0-9a-f]{1,8})\.json$/.exec(filename)
        if (hash == null) {
            this.emit('notice', {
                level: 'warn', label: 'filename',
                directory: this._directory,
                eventType, filename
            })
            return
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
            return
        }
        const expected = parseInt(hash[1], 16)
        const actual = this._hash.call(null, buffer)
        if (actual != expected) {
            this.emit('notice', {
                level: 'warn', label: 'checksum',
                directory: this._directory, eventType, filename,
                actual: (+actual).toString(16), expected: (+expected).toString(16)
            })
            return
        }
        const json = this._safeParse(buffer.toString(), eventType, filename)
        if (json != null) {
            this.emit('data', json)
        }
    }

    async _changed (eventType, filename) {
        await this._harvest(eventType, filename)
        if (this._draining) {
            await this._drained()
        }
    }

    async _shift (shifter) {
        for await (const entry of shifter.iterator()) {
            switch (entry.method) {
            case 'killed':
                // TODO Before you look to see that it is killed, first search
                // for any remaining files.
                this._pids.push(entry.pid)
                await this._killed()
                break
            case 'changed':
                // TODO How do you know you're recording these files in order?
                await this._changed(entry.eventType, entry.filename)
                break
            case 'drain':
                this._draining = true
                await this._drained()
                break
            }
        }
        if (this._draining) {
            this.emit('drain')
        }
    }
}

module.exports = Watcher
