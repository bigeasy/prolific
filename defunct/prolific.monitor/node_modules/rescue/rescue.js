var slice = [].slice
var unshift = [].unshift

module.exports = function (regex, rescue) {
    var vargs = slice.call(arguments), dispatch = []
    while (vargs.length != 0) {
        if (Array.isArray(vargs[0])) {
            unshift.apply(vargs, vargs.shift())
        }
        var regexen = []
        while (vargs[0] instanceof RegExp) {
            var regex = vargs.shift()
            var $ = /^\/\^([$\w][$\w\d]*):/.exec(regex.toString())
            if ($) {
                regexen.push({
                    regex: regex,
                    prefix: $[1] + ':',
                    property: $[1]
                })
            } else {
                regexen.push({
                    regex: regex,
                    prefix: '',
                    property: 'message'
                })
            }
        }
        var value = vargs.shift() || function () {}
        var rescue = typeof value == 'function'
                   ? value
                   : function () { return value }
        dispatch.push({ regexen: regexen, rescue: rescue })
    }
    return function (error) {
        for (var i = 0, I = dispatch.length; i < I; i++) {
            var branch = dispatch[i], regexen = branch.regexen
            for (var j = 0, J = regexen.length; j < J; j++) {
                if (regexen[j].regex.test(regexen[j].prefix + error[regexen[j].property])) {
                    return branch.rescue.apply(this, slice.call(arguments))
                }
            }
        }
        throw error
    }
}
