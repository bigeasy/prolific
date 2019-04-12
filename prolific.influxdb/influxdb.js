function quote (value) {
    if (typeof value == 'string' && /['"]/.test(value)) {
        return '\'' + value.replace(/(')/g, "\\$1") + '\''
    }
    return value
}

var special = /([,= ])/g

module.exports = function (message) {
    var fields = []
    for (var key in message.fields) {
        var value = message.fields[key]
        var trimmed = key.replace(/\$i$/, '')
        if (key != trimmed) {
            value = String(value) + 'i'
        }
        fields.push(trimmed.replace(special, '\$1') + '=' +  quote(value))
    }
    var tags = [ message.measurement ]
    for (var key in message.tags || {}) {
        var value = message.tags[key]
        tags.push(key.replace(special, '\$1') + '=' +  value.replace(special, '\\$1'))
    }
    var vargs = []
    var parts = [ tags.join(','), fields.join(',') ]
    if ('timestamp' in message) {
        if (message.timestamp != 0) {
            parts.push(String(message.timestamp) + '000000')
        } else {
            parts.push('0')
        }
    }
    var newline = typeof message.newline == 'boolean' ? message.newline : true
    if (newline) {
        return parts.join(' ') + '\n'
    }
    return parts.join(' ')
}
