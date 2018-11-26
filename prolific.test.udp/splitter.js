module.exports = function (string) {
    var lines = string.toString().split('\n')
    if (lines[lines.length - 1].length == 0) {
        lines.pop()
    }
    return lines
}
