module.exports = function (program) {
    var seen = {}
    var stdio = [ 0, 1, 2 ].concat(program.arrayed.inherit).map(function (number) {
        if (/^\d+$/.test(number)) {
            return +number
        }
        return +program.env[number]
    }).sort(function (a, b) {
        return a - b
    }).filter(function(number) {
        var exclude = seen[number]
        seen[number] = true
        return ! exclude
    })

    for (var i = 0, I = stdio[stdio.length - 1]; i < I; i++) {
        if (stdio[i] != i) {
            stdio.splice(i, 0, 'ignore')
        }
    }

    return stdio
}
