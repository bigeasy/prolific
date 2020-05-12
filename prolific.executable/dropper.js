// Node.js API.
const Destructible = require('destructible')

class Dropper {
    constructor (logger, interval = 30000) {
        this._dropped = 0
        this._logger = logger
        this._interval = setInterval(() => this._say(), interval)
        this.terminator = {
            terminated: false,
            terminate: () => {
                this.terminator.terminated = true
                this._say()
                clearInterval(this._interval)
            },
            termination: Promise.resolve(true)
        }
    }

    _say () {
        if (this._dropped != 0) {
            this._logger.say('dropped', { dropped: this._dropped })
            this._dropped = 0
        }
    }

    process (entries) {
        this._dropped += entries.length
    }
}

module.exports = Dropper
