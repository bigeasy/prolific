module.exports = function (child, signal) {
    return function () {
        child.kill(signal)
    }
}
