function Sum () {
    this._sum = 0
}

Sum.prototype.sample = function (value) {
    this._sum += value
}

Sum.prototype.summarize = function (value) {
    var sum = this._sum
    this._sum = 0
    return sum
}

module.exports = Sum
