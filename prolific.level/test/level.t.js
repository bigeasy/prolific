require('proof')(1, prove)

function prove (okay) {
    var LEVEL = require('..')
    okay(LEVEL.panic, 0, 'panic')
}
