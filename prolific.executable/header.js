const { Staccato } = require('staccato')

module.exports = async function (input) {
    const staccato = new Staccato(input)
    let accumulator = Buffer.alloc(0)
    for (;;) {
        const buffer = await staccato.readable.read()
        if (buffer == null) {
            return null
        }
        accumulator = Buffer.concat([ accumulator, buffer ])
        if (~accumulator.indexOf(0xa)) {
            staccato.unlisten()
            return JSON.parse(accumulator.toString('utf8'))
        }
    }
}
