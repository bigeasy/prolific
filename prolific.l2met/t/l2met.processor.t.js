require('proof')(3, prove)

function prove (okay) {
    var L2met = require('..')

    var l2met = L2met('count', 'count', 1, { key: 'value' })
    okay(l2met, 'c#count=1 tags=key:value\n', 'format no unit')
    var l2met = L2met('count', 'count', 1, 'ms')
    okay(l2met, 'c#count=1ms\n', 'format no tags')
    var l2met = L2met('count', 'count', 1)
    okay(l2met, 'c#count=1\n', 'format no tags or unit')
}
