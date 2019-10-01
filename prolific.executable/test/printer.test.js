require('proof')(2, async (okay) => {
    const Printer = require('../printer')
    const test = []
    const Destructible = require('destructible')
    const destructible = new Destructible(__filename)
    const latch = {}
    latch.unlatched = new Promise(resolve => latch.unlatch = resolve)
    const printer = new Printer(destructible.durable('printer'), lines => {
        test.push(lines)
        latch.unlatch.call()
    }, JSON.stringify, 100)
    const now = Date.now()
    printer.say('label', { a: 1 })
    printer.push({ entries: [{ when: Date.now(), a: 1 }] })
    await latch.unlatched
    destructible.destroy()
    await destructible.promise
    okay(test.length, 1, 'printed')
    okay(test[0].split('\n').length, 2, 'batched')
})
