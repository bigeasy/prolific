const coalesce = require('extant')

const FACILITY = require('prolific.facility')
const LEVEL = require('prolific.level')

class Processor {
    constructor (configuration) {
        this._application = coalesce(configuration.application, process.title)
        this._hostname = coalesce(configuration.hostname, 'localhost')
        this._facility = FACILITY[coalesce(configuration.facility, 'local0')]
        this._serializer = coalesce(configuration.serializer, JSON)
    }

    format (entry) {
        const pid = entry.pid, when = entry.when
        // TODO Probably faster if I set `undefined`.
        delete entry.when
        delete entry.pid
        const line = [
            '<' + (this._facility * 8 + LEVEL[entry.level]) + '>1',
            new Date(when).toISOString(),
            this._hostname,
            this._application,
            coalesce(pid, '-'),
            '-',
            '-',
            this._serializer.stringify(entry)
        ]
        entry.when = when
        entry.pid = pid
        return line.join(' ') + '\n'
    }
}

module.exports = Processor
