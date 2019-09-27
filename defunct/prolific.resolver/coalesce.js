var slice = [].slice

module.exports = function () {
    var vargs = slice.call(arguments)
    for (var i = 0, I = vargs.length; i < I; i++) {
        if (typeof vargs[i] == 'function') {
            try {
                vargs[i] = vargs[i].call()
            } catch (e) {
                continue
            }
        }
        if (vargs[i] == null) {
            continue
        } else {
            return vargs[i]
        }
    }
    return null
}
