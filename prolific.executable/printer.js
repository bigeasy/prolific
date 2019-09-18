const ascension = require('ascension')
const sort = ascension([ Number ], entry => [ entry.when ])

const Isochronous = require('isochronous')

class Printer {
    constructor (destructible, write, format, interval) {
        this._write = write
        this._entries = []
        this._format = format
        const isochronous = new Isochronous(interval, true, this._check.bind(this))
        destructible.durable('isochronous', isochronous.start())
        destructible.destruct(() => isochronous.stop())
        destructible.destruct(() => this._log(this._entries.splice(0).sort(sort)))
    }

    say (label, entry) {
        this._entries.push({ when: Date.now(), qualifier: 'prolific', label, ...entry })
    }

    push (envelope) {
        this._entries.push.apply(this._entries, envelope.entries)
    }

    _log (entries) {
        if (entries.length != 0) {
            this._write.call(null, entries.map(this._format).join('\n'))
        }
    }

    _check (status) {
        this._entries.sort(sort)
        const stop = status.scheduled - Math.ceil(status.interval * 1.51)
        let i, I
        for (i = 0, I = this._entries.length; i < I; i++) {
            if (this._entries[i].when > stop) {
                break
            }
        }
        this._log(this._entries.splice(0, i))
    }
}

module.exports = Printer
