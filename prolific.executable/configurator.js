const BufferConfigurator = require('reconfigure/buffer')
const path = require('path')
const Evaluator = require('prolific.evaluator')
const fs = require('fs').promises
const Destructible = require('destructible')
const assert = require('assert')

class ProcessorConfigurator extends BufferConfigurator {
    constructor (logger, processor, application) {
        super()
        this._logger = logger
        this._processor = processor
        this._application = application
    }

    async configure (buffer) {
        // Simplify the file path.
        const file = path.resolve(this._processor)
        // Evaluate the source as Node.js `require` based module.
        const source = buffer.toString()
        const resolved = Evaluator.resolve(path.resolve(this._processor), path.resolve(this._application))
        const definition = Evaluator.create(source, resolved)
        // Our triage function is always synchronous, requires no
        // destruction logic.
        // TODO Make it a function not a function builder. Hmm... Maybe a
        // function builder to be certain that the user understands that it is
        // not a member of anything. Yeah, okay, but make a note of that.
        const triage = definition.triage()
        // We must register a `Promise.catch` now to prevent an
        // unhandled exception message.
        // **TODO** Why is this not a sub-destructible?
        const destructible = new Destructible('processor')
        const terminator = {
            termination: new Promise(resolve => {
                // TODO Write about this. I wrote a separate call to
                // `destructible.destructed.catch` and it caused an uncaught
                // exception.
                destructible.promise.then(() => {
                    resolve(true)
                }, error => {
                    this._logger.say('background.error', {
                        error: error.stack,
                        source: source
                    })
                    resolve(false)
                })
            }),
            terminate: function () {
                destructible.destroy()
            },
            terminated: false
        }
        destructible.destruct(() => terminator.terminated = true)
        // Construct our process function. The Destructible can be used
        // by the user to flush file buffers, hang up sockets, etc.
        const process = await definition.process(destructible)
        assert(typeof process == 'function')
        return { buffer, source, resolved, triage, process, terminator }
    }
}

module.exports = ProcessorConfigurator
