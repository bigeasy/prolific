module.exports = function (entry) {
    return entry.formatted || JSON.stringify(entry) + '\n'
}
