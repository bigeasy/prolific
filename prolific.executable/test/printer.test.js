describe('printer', () => {
    const assert = require('assert')
    const Printer = require('../printer')
    it('can print', async () => {
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
        printer.push({ entries: [{ when: now, a: 1 }] })
        printer.say({ when: now, a: 1 })
        await latch.unlatched
        destructible.destroy()
        await destructible.promise
        assert.equal(test.length, 1, 'printed')
        assert.equal(test[0].split('\n').length, 2, 'batched')
    })
})
