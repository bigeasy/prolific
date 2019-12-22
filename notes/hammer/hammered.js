exports.triage = function () {
    return function (level) { return true }
}

exports.process = async function () {
    let count = 0, last = 0
    setInterval(() => {
        console.log('got', count, count - last)
        last = count
    }, 1000)
    return function (entries) {
        count += entries.length
    }
}
