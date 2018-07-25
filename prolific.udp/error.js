module.exports = function (callback) {
    // Because error can be `0` and therefore not null, but not really an error.
    return function (error) {
        if (error) callback(error)
        else callback()
    }
}
