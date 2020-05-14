require('proof')(2, prove)

function prove (okay) {
    const defaults = require('../defaults')

    okay(defaults().suffix, [], 'no suffix')
    okay(defaults({ suffix: 1 }).suffix, [ 1 ], 'suffixed')
}
