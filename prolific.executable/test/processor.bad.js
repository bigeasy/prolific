processor.process = async function () {
    const path = require('path')
    const gather = require(path.join(__dirname, 'gather'))
    const sink = require('prolific.sink')
    return function (entry) {
        if (entry != null) {
            entry.body.subsequent = true
            gather.push(entry)
        }
    }
}
