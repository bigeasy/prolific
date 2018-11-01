var coalesce = require('extant')

module.exports = function (type, label, value, unit, tags) {
    if (typeof unit != 'string') {
        if (unit != null) {
            tags = unit
            unit = ''
        }
    }
    var formatted = [ type.substring(0, 1), '#', label, '=', value, coalesce(unit, '') ]
    var separator = ' tags='
    for (var tag in tags || {}) {
        var value = tags[tag]
        formatted.push(separator, tag, ':', value)
        separator = ','
    }
    formatted.push('\n')
    return formatted.join('')
}
