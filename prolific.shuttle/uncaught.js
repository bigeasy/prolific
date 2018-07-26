module.exports = function (finale) {
    if (typeof finale == 'function') {
        return finale
    } else {
        return function (error) {
            finale.panic('uncaught', { stack: error.stack })
        }
    }
}
