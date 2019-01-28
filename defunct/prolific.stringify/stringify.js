module.exports = function (entry) {
    return entry.formatted.length == 0
         ? JSON.stringify(entry.json) + '\n'
         : entry.formatted.join('')
}
