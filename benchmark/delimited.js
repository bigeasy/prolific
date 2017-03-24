var delimited = module.exports = {
    serialize: function (object) {
        var array = []
        delimited._serialize(array, object)
        array.push('')
        return array.join(' ')
    },
    _serialize: function (array, object) {
        switch (typeof object) {
        case 'object':
            var keys = Object.keys(object)
            array.push('o', keys.length)
            for (var i = 0, I = keys.length; i < I; i++) {
//                array.push(keys[i].split(' ').length, keys[i])
                array.push(1, keys[i])
                delimited._serialize(array, object[keys[i]])
            }
            break
        case 'string':
//            array.push('s', object.split(' ').length, object)
           array.push('s', 1, object)
            break
        }
    },
    _deserialize: function (array) {
        switch (array.shift()) {
        case 'o':
            var object = {}
            for (var i = 0, I = parseInt(array.shift()); i < I; i++) {
                var key = array.splice(0, parseInt(array.shift())).join(' ')
                object[key] = delimited._deserialize(array)
            }
            return object
        case 's':
            return array.splice(0, parseInt(array.shift())).join(' ')
        }
    },
    deserialize: function (string) {
        var array = string.split(' ')
        return delimited._deserialize(array)
    }
}
