module.exports = function (inherit) {
    var seen = {}
    var inherit = [ 0, 1, 2 ].concat(inherit).map(function (number) {
        return +number
    }).sort(function (a, b) {
        return a - b
    }).filter(function(number) {
        var exclude = seen[number]
        seen[number] = true
        return ! exclude
    })

    for (var i = 0, I = inherit[inherit.length - 1]; i < I; i++) {
        if (inherit[i] != i) {
            inherit.splice(i, 0, 'inherit')
        }
    }

    inherit[2] = inherit[inherit.length] = 'pipe'

    return inherit
}
