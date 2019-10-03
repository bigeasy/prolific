require('proof')(1, (okay) => {
    const LEVEL = require('..')
    okay(LEVEL.panic, 0, 'panic')
})
