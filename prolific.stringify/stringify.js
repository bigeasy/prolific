module.exports = function (entry) {
    return entry.formatted || JSON.stringify(entry.json) + '\n'
}
