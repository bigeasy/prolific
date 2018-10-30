exports.create = function (source, require) {
    try {
        return new Function('require', 'return ' + source)(require)()
    } catch (error) {
        return null
    }
}
