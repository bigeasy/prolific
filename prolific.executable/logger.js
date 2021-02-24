// Log by writing to the temp directory with a synchronous write. These log
// entries need to be infrequent. Used for meta information about sidecars and
// the supervisor.

//
const Isochronous = require('isochronous')
const Publisher = require('prolific.queue/publisher')

class Logger {
    constructor (destructible, Date, directory, pid, interval) {
        this._entries = []
        this._publisher = new Publisher(Date, directory, pid)
        this._Date = Date
        const isochornous = new Isochronous(interval, true, this._flush.bind(this))
        destructible.durable('isochornous', isochornous.start())
        destructible.destruct(() => isochornous.stop())
        destructible.destruct(() => this._flush())
    }

    say (label, entry) {
        this._entries.push({ when: this._Date.now(), qualifier: 'prolific', label, ...entry })
    }

    _flush () {
        if (this._entries.length != 0) {
            this._publisher.publish({ method: 'say', entries: this._entries.splice(0) })
        }
    }
}

module.exports = Logger
