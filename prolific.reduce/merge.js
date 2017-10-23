function merge (current, additional) {
    if (typeof current == 'object' && current != null) {
        if (Array.isArray(current) && Array.isArray(additional)) {
            current.push.apply(current, additional)
        } else if (typeof additional == 'object' && additional != null) {
            for (var key in additional) {
                if (key in current) {
                    merge(current[key], additional[key])
                } else if (typeof additional[key] == 'object') {
                    current[key] = JSON.parse(JSON.stringify(additional[key]))
                } else {
                    current[key] = additional[key]
                }
            }
        }
    }
    return current
}
module.exports = merge
