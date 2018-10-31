require('proof')(1, prove)

function prove (okay) {
    try {
        require('..')
    } catch (error) {
        okay(error.message, 'deprecated', 'deprecated')
    }
}
