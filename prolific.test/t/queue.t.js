require('proof')(4, prove)

function prove (okay) {
    var Queue = require('../queue')
    var queue = new Queue
    queue.push({ a: 0 })
    queue.push({ a: 1, b: 'x'  })
    queue.push({ a: 2, b: 'y' })
    queue.push({ a: 3, b: 'z' })
    okay(queue.shift(), { a: 0 }, 'shift null')
    okay(queue.shift(function (entry) {
        return entry.a == 2
    }), { a: 2, b: 'y' }, 'shift function')
    okay(queue.shift({ b: 'z' }), { a: 3, b: 'z' }, 'shift subset')
    okay(queue.shift(), null, 'shift done')
}
