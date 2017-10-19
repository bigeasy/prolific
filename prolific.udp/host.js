var url = require('url')

module.exports = function (host) {
    host = String(host)
    if (~host.indexOf('/')) {
        return url.parse(host)
    }
    var pair = host.split(':')
    if (pair.length == 2) {
        return { hostname: pair[0], port: +pair[1] }
    }
    return null
}
