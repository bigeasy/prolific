// Triage is a properties object with getters and setters and is always
// synchronous and is only a yes or no. We have an entry object as well.
module.exports = return function (properties) {
    if (properties.get('level') >= LEVEL.notice) {
        if (properties.get('error') instanceof Error) {
            properties.set('error', { stack: error.stack })
        }
        return true
    }
    return false
}
