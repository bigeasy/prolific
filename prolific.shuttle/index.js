const Shuttle = require('./shuttle')
const coalesce = require('extant')
exports.create = function (options) {
    return new Shuttle(coalesce(options, {}))
}
