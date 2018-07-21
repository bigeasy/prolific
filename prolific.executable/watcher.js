var fs = require('fs')
var cadence = require('cadence')
var delta = require('delta')
var Demur = require('demur')
var logger = require('prolific.logger').createLogger('prolific.supervisor')
var coalesce = require('extant')
var dirty = require('./dirty')

function Watcher (configuration, processor) {
    this._configuration = configuration
    this._processor = processor
    this._change = null
    this._demur = new Demur({ maximum: 60000 })
    this.destroyed = false
}

Watcher.prototype.destroy = function () {
    this.destroyed = true
    this._demur.cancel()
    if (this._change) {
        this._change.cancel()
    }
}

Watcher.prototype.monitor = cadence(function (async) {
    var loop = async(function () {
        if (!this.destroyed) {
            this._processor.reload(async())
        }
    }, function (contents) {
        var watcher = null
        if (this.destroyed) {
            return [ loop.break ]
        } else if (contents == null) {
            this._demur.retry(async())
        } else {
            try {
                watcher = fs.watch(this._configuration)
            } catch (error) {
                console.log(error.stack)
                logger.error('watch', { message: error.message, code: coalesce(error.code), stack: error.stack })
            }
            if (watcher == null) {
                this._demur.retry(async())
            } else {
                this._demur.reset()
                async(function () {
                    this._change = delta(async()).ee(watcher).on('change')
                    async(function () {
                        dirty(this._configuration, contents, async())
                    }, function (dirty) {
                        if (dirty) {
                            this._change.cancel()
                        }
                    })
                }, function () {
                    this._change = null
                    watcher.close()
                })
            }
        }
    })()
})

module.exports = Watcher
