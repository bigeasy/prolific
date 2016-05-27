module.exports = function (f, value) {
    try { return f() } catch (e) { return value }
}
