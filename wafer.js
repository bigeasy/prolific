function stringify (path, value, out) {
    var left = '[', right = ']'
    switch (typeof value) {
    case 'object':
        if (Array.isArray(value)) {
            for (var i = 0, I = value.length; i < I; i++) {
                stringify(path.concat(i), value[i], out)
            }
        } else if (value === null) {
            out.push(path.join('.') + ';')
        } else {
            for (var key in value) {
                stringify(path.concat(key), value[key], out)
            }
        }
        return null
    case 'number':
    case 'string':
        out.push(path.join('.') + '=' + encodeURIComponent(value) + ';')
        break
    }
}

exports.stringify = function (value) {
    var out = []
    stringify([], value, out)
    return out.join(' ')
}

exports.parse = function (value) {
    var object = []
    if (/\S/.test(value)) {
        value.split(/\s+/).forEach(function (pair) {
            var $ = /^([^=]+)(=?)(.*);$/.exec(pair)
            var iterator = object, path = $[1].split('.')
            for (var j = 0, J = path.length - 1; j < J; j++) {
                if (iterator[path[j]] == null) {
                    iterator[path[j]] = {}
                }
                iterator = iterator[path[j]]
            }
            iterator[path.pop()] = $[2] ? decodeURIComponent($[3]) : null
        })
    }
    return object
}
