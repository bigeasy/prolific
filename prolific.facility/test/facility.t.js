require('proof')(1, (okay) => {
    const LEVEL = require('..')
    okay(LEVEL.kern, 0, 'panic')
})
