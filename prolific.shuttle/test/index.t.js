require('proof')(1, okay => {
    const index = require('..')
    okay(index.create({}))
})
