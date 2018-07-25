require('proof')(1, prove)

function prove (okay) {
    require('../error')(function (error) {
        okay(error.message, 'smh', 'shaking my head')
    })(new Error('smh'))
}
