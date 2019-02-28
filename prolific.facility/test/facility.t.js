require('proof')(1, prove)

function prove (okay) {
    var LEVEL = require('..')
    okay(LEVEL.kern, 0, 'panic')
}
