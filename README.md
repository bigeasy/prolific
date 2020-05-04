[![Actions Status](https://github.com/bigeasy/prolific/workflows/Node%20CI/badge.svg)](https://github.com/bigeasy/prolific/actions)
[![codecov](https://codecov.io/gh/bigeasy/prolific/branch/master/graph/badge.svg)](https://codecov.io/gh/bigeasy/prolific)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Prolific

Prolific is a high-performance logging framework for Node.js with the following
features.

 * Log shipping and any processing is done outside the application process in a
 monitoring process.
 * Lightweight footprint within the application process.
 * Fast triage to quickly reject messages that above the logging level, or based
 on criteria that test any part of the logging message.
 * Fast batched log transport out of the application at runtime through a pipe.
 * Tunneling fatal messages to the monitor through standard error on a crash.
 * Hot reload of logging configuration to change logging levels on an
 application in flight.
 * Works well with multi-process applications.

## Pending Changes

Prolific will remove the object based processor and replace destruction
mechanics with a `Destructible` instance in Prolific 27.0.0.

## Getting Started

```javascript
require('prolific.shuttle').start({ exit: true })

require('prolific.sink').properties.global = 1

const logger = require('prolific.logger').create('example')

logger.info('test', { local: 2 })
```

The program will run and produce no output. You'll have to run it under
prolific for it produce output. You'll need a Prolific configuration.

```javascript
processor.triage = function (require) {
    const LEVEL = require('prolific.level')
    return function (level) {
        return level <= LEVEL.info
    }
}

processor.process = function () {
    return function (entries) {
        for (const entry of entries) {
            console.log(JSON.stringify(entry))
        }
    }
}
```

Now you can run the following.

```console
$ prolific -p ./processor.js program.js
{"when":1100,"qualifier":"compassion","label":"test","qualified":"compassion#test",global:1,local:2}
$
```

## High-Throughput But Still Thorough

Inspired by an employer directive  to use the logging edicts of [The
Twelve-Factor App](https://12factor.net/logs), my first go was to do just as it
said, to write logs to standard out and pipe the messages to a log transport
program.

However, writes to standard out are synchronous which was a disaster for the
performance of the application. This was improved by batching writes, but
ultimate we ended up using a library that wrote to a socket.

The problem was then that we where losing final, fatal errors of an application
crash. This is because writing to a pipe is asynchronous, but a fatal exception
won't write because there will not be a next tick in which to perform the write.

Prolific addresses this performance by running the application program under a
monitor. During normal operation the child writes batches of messages over a
pipe to the monitor process. In the event of an error exit the pipe is closed
and the final messages are encoded into a line format and written to standard
error. The monitor pulls the encoded line format  out of the standard error
stream and reconstructs the messages, feeding them to transport as if it where
all one continuous stream.

Although we've deviated from the standard out edict of The Twelve-Factor App,
we've maintained the spirit of the edict, that the application should do no log
processing or transport on its own, producing a *stream* of log messages. We've
merely tweaked the pipe down which that stream flows to be more resilient so
that no part of the stream is lost.

Am I making it up? No. This is a problem that Pino, for example, addresses the same
fatal error handling issues with
[`pino.final()`](https://github.com/pinojs/pino/blob/master/docs/api.md#pino-final)
which is used in [this snippet of
code](https://github.com/pinojs/pino/blob/master/docs/extreme.md#log-loss-prevention)
to prevent log loss. Prolific performs this automatically, transparently.

## Multi-Process Ready

Prolific was designed to monitor multi-process servers. It can ship the logs for
multiple child processes using one monitor to serivce a number of child
processes. The synchronous fatal error tunneling is done in such a way that even
when multiple child processes are spewing their hurt down a common pipe, the
Prolific monitor is still able to extract the tunneled message from the
interplated text in the stream.

## Prolific Fast Triage

You control logging levels, not through a flag or string defination, but through
a JavaScript function.

```javascript
processor.triage = function (require) {
    const LEVEL = require('prolific.level')
    return function (level) {
        return level <= LEVEL.warn
    }
}
```

You define a triage function builder. The builder will create a triage function.
We use a builder so you have an opportunity to require any dependencies needed
in your triage function.

The triage function is pushed into your application and used by the logging
framework to triage log messages. No pattern matching, string munging logic,
just a function &mdash; a function that gets compiled and possibly inlined so
that the logging check is a fast as possible.

Actually, the triage function is called with the entire logging message, so
you can create whatever sort of filter you'd like based on the logging message
properties.

```javascript
processor.triage = function (require) {
    const LEVEL = require('prolific.level')
    return function (level, header, body, system) {
        return level <= LEVEL.warn || header.qualifier == 'compassion'
    }
}
```

The above would log warnings or worse, plus everything from the logger from the
Compassion NPM module. They components are kept apart to save the cost of
merging, the components will be merged into a single logging entry if triage
passes.

Note that triage functions are synchronous.

## Processor Functions

While the triage function is synchronous, the process function is asynchronous,
so you can perform whatever network communication you need to to get your logs
to their final resting place. Your process function can do whatever sort of log
processing it needs to, or it might be as simple as this.

```javascript
processor.process = async function (require) {
    const axios = require('axios')
    return async function (entries) {
        await axios.post('http://logger.local/ingest', entries)
    }
}
```

The processor does not run in your application process. It runs in the monitor
process. It is called with a batch of messages so you can send them over the
network in batches.

You define a constructor function that returns a processor function. Both the
constructor function and processor function can be `async` functions so you can
perform asynchronous work in your processor.

## Processor Objects

If you need to clean up after your processor you can instead return a processor
object. The example below doesn't do any error handling, sadly, but you get the
picture.

```javascript
processor.process = async function (require) {
    const net = require('net')
    const socket = net.connect('logger.local:8514')
    await new Promise(resolve => socket.once('connect', resolve))
    return {
        process: async function (entry) {
            await new Promise(resolve => socket.write(JSON.stringify(entry), resolve))
        },
        destroy: function () {
            socket.destroy()
        }
    }
}
```

The `destroy` method can also be `async`.

## Logging Configuration

Logging configuration is code. It consists of the triage and processor function.
They are similar to a Node.js module, but they are not Node.js modules.

```javascript
processor.triage = function (require) {
    const LEVEL = require('prolific.level')
    return function (level, header, body, system) {
        return level <= LEVEL.warn || header.qualifier == 'bigeasy#compassion'
    }
}

processor.process = async function (require) {
    const axios = require('axios')
    return async function (entries) {
        await axios.post('http://logger.local/ingest', entries)
    }
}
```

You define the triage function and the processor in the same file. You must
define both, there are no defaults.

## Reconfiguration

You can update your logging triage and processor for an running application by
updating the logging configuration file. The Prolific monitor will detect the
change, reload the file, compile the functions and push the new triage function
into your application process.

This is a risky proposition, of course. It is useful for low risk changes like
changing the logging level. But, it is helpful to do things like change logging
levels in flight, or send logging to a different endpoint if one fails.

You should verify the changes using unit testing prior to deploying a change.
You can also have different configurations that you've already tested that you
can switch to regularly to ensure that the different logging configurations work
well and transition well.
