require('proof')(1, prove)

function prove (okay) {
    var coalesce = require('../coalesce')
    okay(coalesce(function () { throw Error }, 'x'), 'x', 'coalesce')
}
