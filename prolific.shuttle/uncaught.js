module.exports = function (finale) {
    if (typeof finale == 'function') {
        return finale
    } else {
        return function (error) {
            finale.error('uncaught', { stack: error.stack })
        }
    }
}
