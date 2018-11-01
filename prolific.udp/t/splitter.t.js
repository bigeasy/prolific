require('proof')(2, prove)

function prove (okay) {
    var Splitter = require('../splitter')
    okay(Splitter('x\ny\nz\n'), [ 'x', 'y', 'z' ], 'eol')
    okay(Splitter('x\ny\nz'), [ 'x', 'y', 'z' ], 'no eol')
}
