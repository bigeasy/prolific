function Count () {
    this._count = 0
}

Count.prototype.sample = function (value) {
    this._count++
}

Count.prototype.summarize = function (value) {
    var count = this._count
    this._count = 0
    return count
}

module.exports = Count
