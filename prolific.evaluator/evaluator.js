exports.create = function (source) {
    var f = Function.apply(Function, [].concat(
        '$', '$qualifier', '$level',
        'PANIC', 'EMERG', 'ALERT', 'CRIT', 'ERR', 'ERROR', 'WARN', 'WARNING',
        'NOTICE', 'INFO', 'DEBUG', 'TRACE',
        'require', Object.keys(global),
        'return ' + source
    ))
    return function (entry) {
        console.log('arity', f.length)
        return f(entry.json, entry.qualifier, entry.level, 0, 0, 1, 2, 3, 3, 4, 4, 5, 6, 7, 7)
    }
}
