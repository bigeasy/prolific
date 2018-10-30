exports.create = function (f, require) {
    try {
        return new Function('require', 'return ' + f.toString())(require)()
    } catch (error) {
        return null
    }
}
