const coalesce = require('extant')

module.exports = function (options = {}) {
    return {
        Date: coalesce(options.Date, Date),
        rotation: coalesce(options.rotate, Infinity),
        suffix: ('suffix' in options) ? [ options.suffix ] : []
    }
}
