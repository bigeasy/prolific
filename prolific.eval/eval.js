exports.create = function () {
    var vargs = Array.prototype.slice.call(arguments)
    var source = vargs.pop()
    return Function.apply(Function, [
        '$', '$qualifier', '$level', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'
    ].concat(vargs, 'return ' + source))
}

exports.invoke = function () {
    var vargs = Array.prototype.slice.call(arguments)
    var f = vargs.shift()
    var entry = vargs.shift()
    return f.apply(null, [ entry.json, entry.qualifier, entry.level, 4, 3, 1, 0, 0 ].concat(vargs))
}
