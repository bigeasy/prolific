module.exports = function (f) {
    try { return f() } catch (e) { return null }
}
