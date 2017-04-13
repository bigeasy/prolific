require('proof')(1, prove)

function prove (assert) {
    var killer = require('../killer')
    killer({
        kill: function (signal) {
            assert(signal, 'SIGINT', 'killed')
        }
    }, 'SIGINT')()
}
