require('proof')(1, (okay) => {
    const uncaught = require('../uncaught')
    try {
        require('../uncaught')('uncaught')(new Error('thrown'))
        throw new Error
    } catch (error) {
        okay(error.message, 'thrown', 'rethrown')
    }
})
