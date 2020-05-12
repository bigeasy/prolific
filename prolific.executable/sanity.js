const fs = require('fs')

const watcher = fs.watch('foo.txt')
watcher.on('change', function (type) {
    console.log(type)
})
