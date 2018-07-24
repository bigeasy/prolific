exports.create = function () {
    var vargs = Array.prototype.slice.call(arguments)
    var source = vargs.pop()
    var f = Function.apply(Function, vargs.concat(
        '$', '$qualifier', '$level',
        'PANIC', 'EMERG', 'ALERT', 'CRIT', 'ERR', 'ERROR', 'WARN', 'WARNING',
        'NOTICE', 'INFO', 'DEBUG', 'TRACE',
        'require', Object.keys(global),
        'return ' + source
    ))
    return function () {
        var vargs = Array.prototype.slice.call(arguments)
        var entry = vargs.shift()
        return f.apply(null, vargs.concat(entry.json, entry.qualifier, entry.level, 0, 0, 1, 2, 3, 3, 4, 4, 5, 6, 7, 7))
    }
}
