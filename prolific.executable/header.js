const Staccato = require('staccato')

module.exports = async function (input) {
    const readable = new Staccato.Readable(input)
    let accumulator = Buffer.alloc(0)
    for (;;) {
        const buffer = await readable.read()
        if (buffer == null) {
            return null
        }
        accumulator = Buffer.concat([ accumulator, buffer ])
        if (~accumulator.indexOf(0xa)) {
            readable.destroy()
            return JSON.parse(accumulator.toString('utf8'))
        }
    }
}
