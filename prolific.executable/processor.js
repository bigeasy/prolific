// Node.js API.
var fs = require('fs')
var assert = require('assert')

// Control-flow utilities.
var cadence = require('cadence')
var Turnstile = require('turnstile')
Turnstile.Check = require('turnstile/check')

// Pipeline processing and filtering.
var Pipeline = require('prolific.pipeline')
var Acceptor = require('prolific.acceptor')

var interrupt = require('interrupt').createInterrupter('prolific')
var logger = require('prolific.logger').createLogger('prolific.supervisor')

// Construct a processor that will reload it's configuration from the given
// configuration and call the given function with the new in-process Acceptor
// configuration. The in-process Acceptor configuration will be routed to the
// child process we're monitoring and injected into it so that the first round
// of filtering will happen in-process saving copying time.
//
// The given destructible is used to manage the lifecycle of the pipeline and
// its processors.

//
function Processor (destructible, configuration, reloaded) {
    var turnstile = new Turnstile
    turnstile.listen(destructible.monitor('reopen'))
    destructible.destruct.wait(turnstile, 'close')
    this.destroyed = false
    this._configuration = configuration
    this._reloaded = reloaded
    this._check = new Turnstile.Check(this, '_reload', turnstile)
    this._destructible = destructible
    this._destructible.markDestroyed(this)
    this._version = 0
    this._versions = []
}

// This is like the problem of the Chaperon in Compassion that gets an event to
// peform a meta-consensus action, but while it performing service discovery the
// participant it is trying to place shuts down. Not the easiest race to test.
//
// We encountered this already here in testing. We shutdown the monitor in the
// middle of it's first reload and it hung because `Destructible.monitor` is
// called and it has some convoluted logic where if it is destroyed, it wants to
// wait for the destruction to complete, but it won't because our Turnstile is
// waiting for this function to complete, and our Destructible is waiting on the
// Turnstile.
//
// What is the nature of this problem? In the case of Compassion is is
// Happenstance and Destructible interacting, in this case it is Turnstile and
// Destructible interacting. Events that generate new stacks?

//
Processor.prototype._pipeline = cadence(function (async) {
    async(function () {
        fs.readFile(this._configuration, 'utf8', async())
    }, function (configuration) {
        interrupt.assert(!this.destroyed, 'destroyed')
        configuration = JSON.parse(configuration)
        async(function () {
            this._destructible.monitor([ 'pipeline', this._version ], true, Pipeline, configuration.pipeline, async())
        }, function (pipeline, destructible) {
            return [ configuration, pipeline, destructible ]
        })
    })
})

Processor.prototype.load = cadence(function (async) {
    async(function () {
        this._pipeline(async())
    }, function (configuration, pipeline, destructible) {
        this._pipelineDestructible = destructible
        var acceptor = new Acceptor(configuration.accept, configuration.chain)
        this._processor = {
            process: function (entry) {
                console.log('processing', entry)
                if (acceptor.acceptByContext(entry)) {
                    pipeline.process(entry)
                }
                console.log('done')
            }
        }
    })
})

Processor.prototype.updated = cadence(function (async, version) {
    console.log('UPDATED')
    var configuration = this._versions.shift()
    assert(version == configuration.version)
    this._processor = configuration.processor
    configuration.destructible.completed.wait(async())
    configuration.destructible.destroy()
})

Processor.prototype.process = cadence(function (async, envelope) {
    var lines = envelope.body.buffer.toString().split('\n')
    if (lines[lines.length - 1].length == 0) {
        lines.pop()
    }
    var entries = lines.map(JSON.parse)
    var loop = async(function () {
        while (entries.length && !Array.isArray(entries[0])) {
            this._processor.process(entries.shift())
        }
        if (entries.length == 0) {
            return [ loop.break ]
        } else {
            console.log('ENTRIES', entries)
            this.updated(entries.shift()[0].version, async())
        }
    })()
})

Processor.prototype._reload = cadence(function (async, configuration) {
    async([function () {
        this._pipeline(async())
    }, function (error) {
        console.log(error.stack)
        // TODO Logging with the notion of a separate log for the monitor.
        logger.error('pipeline', { configuration: configuration, error: error.stack })
        return [ async.break, null ]
    }], function (configuration, pipeline, destructible) {
        var version = this._version++
        this._versions.push({
            destructible: this._pipelineDestructible,
            version: version,
            processor: pipeline
        })
        this._pipelineDestructible = destructible
        this._reloaded({ version: version, accept: configuration.accept, chain: configuration.chain })
        return [ configuration ]
    })
})

Processor.prototype.reload = function (callback) {
    console.log('YES RELOAD')
    this._check.check(callback)
}

module.exports = cadence(function (async, destructible, configuration, reloaded) {
    var processor = new Processor(destructible, configuration, reloaded)
    async(function () {
        processor.load(async())
    }, function () {
        return [ processor ]
    })
})
