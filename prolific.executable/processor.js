// Node.js API.
const assert = require('assert')
const path = require('path')
const events = require('events')

const Reconfigurator = require('reconfigure')
const BufferConfigurator = require('reconfigure/buffer')
const LEVEL = require('prolific.level')
const sink = require('prolific.sink')
const Evaluator = require('prolific.evaluator')

const Destructible = require('destructible')

// Construct a processor that will reload it's configuration from the given
// configuration and call the given function with the new in-process Acceptor
// configuration. The in-process Acceptor configuration will be routed to the
// child process we're monitoring and injected into it so that the first round
// of filtering will happen in-process saving copying time.
//
// The given destructible is used to manage the lifecycle of the pipeline and
// its processors.

//
class Processor extends events.EventEmitter {
    constructor (module) {
        super()
        this.destroyed = false

        this._destructible = new Destructible('prolific/processor')
        this._destructible.destruct(() => this.destroyed = true)

        const file = this._configuration = path.resolve(module)

        this._version = 0
        this._versions = []

        this._backlog = []
        sink.json = function (level, qualifier, label, body) {
        }
        this._processor = {
            previous: () => {},
            process: entry => this._backlog.push(entry)
        }

        this._reconfigurator = new Reconfigurator(file, new class extends BufferConfigurator {
            async configure (buffer) {
                const source = buffer.toString()
                const processor = Evaluator.create(source, file)
                assert(processor.triage && processor.process)
                const triage = processor.triage(require('prolific.require').require)
                const process = await processor.process(require('prolific.require').require)
                return { buffer, source, triage, process }
            }
            reload (previous, buffer) {
                return super.reload(previous.buffer, buffer)
            }
        })
        this._reconfigurator.on('error', this.emit.bind(this, 'error'))
        this._nextVersion = 0

        this._destructible.destruct(() => this._reconfigurator.destroy())
    }

    destroy () {
        this._destructible.destroy()
    }

    _setMonitorSink (process) {
        sink.json = function (level, qualifier, label, body, system) {
            process(Object.assign({
                when: body.when || this.Date.now(),
                level: level,
                qualifier: qualifier,
                label: label,
                qualified: qualifier + '#' + label
            }, system, body))
        }
    }

    async configure () {
        const { source, triage, process } = await this._reconfigurator.shift()
        this._setMonitorSink(process)
        this._processor = {
            previous: this._processor.previous,
            process: entry => {
                const header = {
                    when: entry.when,
                    level: entry.level,
                    qualified: entry.qualifier + '#' + entry.label,
                    qualifier: entry.qualifier,
                    label: entry.label
                }
                if (triage(LEVEL[entry.level], header, entry.body, entry.system)) {
                    process(Object.assign(header, entry.system, entry.body))
                }
            }
        }
        for (const entry of this._backlog) {
            this._processor.process(entry) 
        }
        const version = this._version++
        this._versions.push({ previous: () => {}, version, process })
        this._previous = process
        this.emit('configuration', { version, source, configuration: this._configuration })
        for await (const { source, process } of this._reconfigurator) {
            const version = this._version++
            this._versions.push({ previous: this._previous, version, process })
            this._previous = process
            this.emit('configuration', { version, source, configuration: this._configuration })
        }
    }

    // Async because if we have a version bump we have to wait for the
    // previous processor to drain to start the new one, however we are not
    // processing per message, we are getting chunks of messages and those
    // are processed synchronously.
    async process (entries) {
        assert(!this.destroyed)
        for (;;) {
            // TODO Here we could wrap in a try/catch and on we could revert to
            // a fallback. The the triage and processor would be rebuilt, maybe
            // we hash the source so we don't use it again, we'd have to apply
            // triage in the monitor as if it where startup, so we might be
            // filtering incorrectly, the fallback might crash because it is
            // missing messages (but it shouldn't do that because messages do go
            // missing for many reasons) but better than crashing and it will
            // even out when the child gets the new triage shorty, or...
            //
            // We just drop messages until the reverted triage is in place.
            //
            // Which keeps the program running when it would have crashed.
            //
            // But, then, if you really want to fuss, maybe the previous
            // processor depended on a message emitted at program start, so if
            // the user is not designing for processing a possibly inconsistent
            // stream of messages, we're not going to be able to fix that for
            // them here.
            //
            // Stretch goal, though.
            //
            // Could we get more performance if processors handled messages in a
            // chunked fashion, send an entire array of entries?
            //
            // We could set it up so that we flag our version somewhere earlier
            // and this method is called only with sync message processing.
            //
            // TODO Okay, we're already batching things into arrays, so we can
            // have a special function in the shuttle that forces a batch of any
            // existing messages, then creates a single entry array with the
            // control message. Those messages can be detected at
            // deserialization and a sync process function can be called, we
            // have an ansyc control function for version bumps, now processors
            // handle entries in batches, which means that they don't have to
            // worry about chunking posts to 3rd parties, they're already kind
            // of chunked.
            while (entries.length && !Array.isArray(entries[0])) {
                this._processor.process(entries.shift())
            }
            if (entries.length == 0) {
                break
            } else {
                const control = entries.shift()[0]
                switch (control.method) {
                case 'version':
                    const configuration = this._versions.shift()
                    assert(this._nextVersion == configuration.version)
                    this._nextVersion++
                    const process = configuration.process
                    await this._processor.previous.call(null, null)
                    this._processor = {
                        previous: configuration.previous,
                        process: entry => {
                           process(Object.assign({
                                when: entry.when,
                                level: entry.level,
                                qualified: entry.qualifier + '#' + entry.label,
                                qualifier: entry.qualifier,
                                label: entry.label
                            }, entry.system, entry.body))
                        }
                    }
                    this._setMonitorSink(process)
                    break
                case 'exit':
                    await this._processor.previous.call(null, null)
                    for (const version of this._versions) {
                        await version.process.call(null, null)
                    }
                    this._destructible.destroy()
                    await this._destructible.promise
                    break
                }
            }
        }
    }
}

module.exports = Processor
