function Sum () {
    this._sum = 0
}

Count.prototype.sample = function (value) {
    this._sum += value
}

Count.prototype.summarize = function (value) {
    var sum = this._sum
    this._sum = 0
    return sum
}
