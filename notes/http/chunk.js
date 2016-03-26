var abend = require('abend')
var cadence = require('cadence')
cadence(function (async) {
    var http = require('http')
    var request = http.request({
        host: '127.0.0.1',
        port: 8088,
        headers: {
            'Transfer-Encoding': 'chunked'
        }
    })
    request.on('response', function (response) {
        console.log(response.statusCode)
    })
    async(function () {
        var count = 0, loop = async(function () {
            request.write('abcdefghijklmnopqrstuvwxyz\n', async())
        }, function () {
            if (count++ == 12) {
                return loop.break
            }
            setTimeout(async(), 1000)
        })()
    }, function () {
        request.end()
    })
})(abend)
