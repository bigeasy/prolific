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

    log (entry) {
        this._entries.push({ when: this._Date.now(), ...entry })
    }

    _flush () {
        if (this._entries.length != 0) {
            this._publisher.publish({ method: 'log', entries: this._entries.splice(0) })
        }
    }
}

module.exports = Logger
