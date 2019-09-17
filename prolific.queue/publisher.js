const fs = require('fs')
const path = require('path')
const fnv = require('hash.fnv')

class Publisher {
    constructor (Date, directory, pid) {
        this._Date = Date
        this._directory = directory
        this._pid = pid
        this._syncSeries = 0xffffff
    }

    publish (body) {
        const buffer = Buffer.from(JSON.stringify({
            start: this._start,
            pid: this._pid,
            series: this._syncSeries = (this._syncSeries + 1) & 0xffffff,
            when: this._Date.now(),
            body: body
        }))
        const hash = Number(fnv(0, buffer, 0, buffer.length)).toString(16)
        const filename = `prolific-${this._pid}-${this._Date.now()}-${hash}.json`
        const files = {
            stage: path.resolve(this._directory, 'stage', filename),
            publish: path.resolve(this._directory, 'publish', filename)
        }
        fs.writeFileSync(files.stage, buffer)
        fs.renameSync(files.stage, files.publish)
    }
}

module.exports = Publisher
