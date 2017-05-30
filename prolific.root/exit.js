module.exports = function (exitCode, signal) {
    if (exitCode != null) {
        return exitCode
    }
    if (signal == 'SIGTERM') {
        return 0
    }
    return 1
}
