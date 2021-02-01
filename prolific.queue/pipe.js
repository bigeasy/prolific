const stream = require('stream')
const { Duplex } = require('./duplicitous')

class Pipe {
    constructor (up = {}, down = {}) {
        this.client = new Duplex
        this.server = new Duplex
        this.client.output.pipe(this.server.input)
        this.server.output.pipe(this.client.input)
    }
}

module.exports = Pipe
