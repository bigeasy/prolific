function expode (error) {
    var properties = { stack: error.stack }
    for (var name in error) {
        if (error.hasOwnProperty(name)) {
            var value = error[name]
            if (value instanceof Error) {
                properties[name] = expode(value)
            } else {
                properties[name] = value
            }
        }
    }
    return properties
}

module.exports = function (finale) {
    if (typeof finale == 'function') {
        return finale
    } else {
        return function (error) {
            finale.error('uncaught', expode(error))
        }
    }
}
