var coalesce = require('./coalesce')

var shuttle = {
    main: coalesce(function () {
        return require.main.require('prolific.shuttle').sink
    }),
    mine: coalesce(function () {
        return require('prolific.sink')
    })
}

exports.sink = coalesce(shuttle.main, shuttle.mine)
