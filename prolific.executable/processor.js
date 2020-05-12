// Node.js API.
const assert = require('assert')
const path = require('path')
const events = require('events')

// Reconfigurator reloads and compiles a configuration file when it changes.
const Reconfigurator = require('reconfigure')
const BufferConfigurator = require('reconfigure/buffer')
const sink = require('prolific.sink')
const Evaluator = require('prolific.evaluator')

const Destructible = require('destructible')

const Dropper = require('./dropper')

function createProcessor (processor, {
    process, terminator, version, source
}) {
    return function (entries) {
        if (terminator.terminated) {
            processor._processor = new Dropper(processor._logger)
            processor._processor.process(entries)
            // We must return a promise and I'm to stingy to make this
            // wrapper function `async` because it will create a second
            // promise, so we'll create a promise only when we need it
            // with this `async` function.
            return async function () {
                if (await terminator.termination) {
                    processor._logger.say('terminated', { source })
                }
            } ()
        }
        try {
            return process(entries)
        } catch (error) {
            processor._logger.say('process.error', { stack: error.stack })
            return null
        }
    }
}

class Processor extends events.EventEmitter {
    constructor (logger, reconfigurator, _Date = Date) {
        super()

        // If true we've begun or completed destruction.
        this.destroyed = false

        // Internal logger.
        this._logger = logger

        // The next version.
        this._version = 0

        // A list of constructed processors and their version numbers.
        this._versions = []

        // Logging sink used by user defined processor, Prolific uses a separate
        // logger that logs to standard out.
        sink.json = (level, qualifier, label, body, system) => {
            assert(typeof level == 'string')
            this._processor.process([{ when: _Date.now(), level: level, qualifier, label, body, system }])
        }

        // A delegate processor constructed from the user defined process
        // function.
        this._processor = null

        // The `Reconfigurator` watches a loads processor definition file, a
        // JavaScript module, and watches it for changes. It will load, compile
        // and initialize a process function.
        //
        // At some point I wanted the `Reconfigurator` to handle rollback, but
        // that is too clever. The user process function is given a
        // `Destructible` instance so it can run background strands that do
        // things like rotate logging files. These background strands can throw
        // exceptions after initialization. Or a simple process function could
        // have a bug and throw an exception every time it logs, or maybe it is
        // just intermittantly. Dealing with a faulty processor is an operations
        // issue. There ought to be enough logging information to trigger an
        // operations response which can use Prolific to rollback by chosing to
        // deploy a new processor.

        // Okay, now, this gets passed in so we can mock it good, and try all
        // the different failure conditions.

        //
        this._reconfigurator = reconfigurator

        // A double-check that we're keeping track of versions correctly.
        this._nextVersion = 0
    }

    // The only way we can effect rollback is to drop messages for a period of
    // time since we're not going to be able to trust that the application's
    // triage function is feeding an older processor messages that it can
    // handle.

    // Grr.. Now I have to consider races. What if we want to rollback to an
    // earlier version, but a new version appears? Seems like the rollback must
    // take place before we can go forward, even if the new version would be
    // better than the previous version. Assume there was a first version that
    // ran for a while, now we have a bad version on disk, it starts but fails
    // asynchronously. Okay, why would we ever stop running the application
    // because logging failed, though? Wouldn't we want to decide at an
    // operational level whether to stop the application, or possibly update the
    // logging configuration? Wouldn't it be better to report that the logger
    // had failed, stop logging, and wait for the user to update the logger with
    // a better logger.

    // Yes, I like this much better than having Prolific do clever things.
    // Instead, Prolific will do very well defined things. If the processor
    // stops working, Prolific will continue to run, albeit without logs, until
    // a new and better Processor is deployed.

    // We can log dropped messages every thirty seconds or so.

    // Now we'll have `Reconfigurator` ensure that we got a process function
    // built, and perhaps the user should ensure that it will run correctly,
    // attempting to connect to HTTP or checking that file paths exist, prior to
    // actually setting out to run. If it dies during operation, Prolific will
    // complain bitterly. The user should detect this in their monitoring and
    // rollback through their DevOps. Thus, Prolific will not go forward if
    // things are prohibitively bad, but it won't go back.

    // TODO HUP reload processors. But, there's a reason we don't HUP
    // processors. We don't want to interfere with the HUP handler of the
    // application if it has one. We might be able to signal a HUP through the
    // temporary directory.

    // TODO Leaning toward HUP separation. So, no signal based reload?

    // We receive a process function that has been build by our
    // `Reconfigurator`. It returns the `process` function and a `Terminator`
    // object which is a wrapper around a `Destructible` given to the user
    // defined function to monitor any background strands. This will log an
    // error if the `Destructible` errors. The `Terminator` wrapper exposes a
    // `temrination` `Promise` that will resolve `true` if the `Destructible`
    // has destructed without an error, `false` if it destructed with an
    // error. As noted, the `Terminator` will log the error, so this
    // `terminator` `Promise` will not raise an exception. I'm saving the
    // trouble of having a swallowing `try`/`catch` block in this module
    // somewhere.

    //
    async configure () {
        // First shift is a load and it will error if the source does not build.
        const entry = await this._reconfigurator.shift()

        const { triage, process, source, terminator } = entry.body

        // When we start up the application will not have the triage function,
        // so it will send us everything. We'll want to triage in the sidecar
        // until the first version arrives.

        //
        const triaged = createProcessor(this, entry.body)
        const processor = this._processor = {
            process: function (entries) {
                return triaged(entries.filter(entry => {
                    return triage(entry.level, entry.qualifier, entry.label, entry.body, entry.system)
                }))
            },
            terminator: terminator
        }

        // We force the `Reconfigurator` to emit this a second time so the
        // `reconfigure` function can handle this initial as a reload and ship
        // the `triage` function to the application.
        this._reconfigurator.unshift(Buffer.from(source))
    }

    // Handle a reload by creating pushing a new processor onto the version
    // queue and shipping the source for to the application so it can compile it
    // for the triage function and replace the triage function.

    // If processor changes are detected after we have been destroyed, we simply
    // destroy those new processors as they arrive.

    //
    async reconfigure () {
        for await (const configuration of this._reconfigurator) {
            await new Promise(resolve => setImmediate(resolve))
            switch (configuration.method) {
            case 'configure': {
                    const processor = {
                        process: createProcessor(this, configuration.body),
                        terminator: configuration.body.terminator
                    }
                    if (this.destroyed) {
                        this._replace(processor)
                    } else {
                        // This will only be run the first time through, we need to
                        // catch our kk
                        const version = this._version++
                        this._versions.push({ version, processor })
                        const { source, resolved } = configuration.body
                        this.emit('processor', { version, source, resolved })
                    }
                }
                break
            case 'error': {
                    this._logger.say('configure', {
                        stack: configuration.body.stack,
                        source: configuration.body.buffer.toString()
                    })
                }
                break
            }
        }
        this._replace(null)
    }

    _replace (next) {
        const previous = this._processor
        this._processor = next
        previous.terminator.terminate()
        return previous.terminator.terminated
    }

    // Async because if we have a version bump we have to wait for the
    // previous processor to drain to start the new one, however we are not
    // processing per message, we are getting chunks of messages and those
    // are processed synchronously.

    //
    async process (batch) {
        assert(!this.destroyed)
        switch (batch && batch.method) {
        case 'version': {
                const version = this._versions.shift()
                assert(this._nextVersion == version.version)
                assert(this._nextVersion == batch.version)
                this._nextVersion++
                await this._replace(version.processor)
            }
            break
        case 'entries': {
                if (batch.entries.length != 0) {
                    await this._processor.process(batch.entries)
                }
            }
            break
        case null: {
                // This is what I did to signal end of stream before. So do we
                // have a rule that says you're not supposed to panic if you get
                // a message you can't handle? Yes, we do.
                await this._processor.process([{
                    when: sink.Date.now(),
                    level: 'panic',
                    qualifier: 'prolific',
                    label: 'eos',
                    body: {},
                    system: sink.properties
                }])
                // Shutdown any processors whose version did not arrive.
                for (const version of this._versions) {
                    await this._replace(version.processor)
                }
                // The `reconfigure` method will destroy the remaining
                // processor.
                this.destroyed = true
                this._reconfigurator.destroy()
            }
            break
        }
    }
}

module.exports = Processor
