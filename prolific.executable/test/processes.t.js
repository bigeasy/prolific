require('proof')(5, prove)

function prove (okay) {
    var Tree = require('../processes')
    var tree = new Tree(1)

    okay(tree.processes([ 1 ]), [ 1 ], 'root processes')
    okay(tree.processes([ 1, 2 ]), [], 'not found processes')

    tree.put([ 1, 2, 3 ])

    okay(tree.processes([ 1, 2 ]), [ 2, 3 ], 'found process and child')

    tree.prune([ 1, 4, 5 ])

    okay(tree.processes([ 1, 2 ]), [ 2, 3 ], 'prune nothing')

    tree.put([ 1, 2, 3 ])
    tree.put([ 1, 4, 5  ])

    tree.prune([ 1, 2 ])

    okay(tree.processes([ 1 ]), [ 1, 4, 5 ], 'prune')
}
