function Properties (properties) {
    this._properties = properties
}

Properties.prototype.get = function (key) {
    for (var i = this._properties.length - 1; i != -1; i--) {
        if (key in this._properties[i]) {
            return this._properties[i][key]
        }
    }
}

Properties.prototype.set = function (key, value) {
    this._properties[this._properties.length - 1][key] = value
}

Properties.prototype.remove = function (key) {
    var got = this.get(key)
    for (var i = 0, I = this._properties.length; i < I; i++) {
        delete this._properties[i][key]
    }
    return got
}

module.exports = Properties
