function Average (configuration) {
    this._context = configuration.context
    this._name = configuration.name
    this._inquiry = inquiry(configuration.inquiry)
    this._parse = configuration.integer ? function (value) {
        return Number.parseInt(value, configuration.base)
    } : function (value) {
        return Number.parseFloat(value)
    }
    this.assessment = new Assessment({ empty: 0 }).windows.pop()
}

Average.prototype.start = function (callback) {
    callback()
}

Average.prototype.filter = function (entry) {
    if (entry.context = this._context && entry.name == this._name) {
        var value = this._inquiry.call(entry)
        if (value != null) {
            value = this._parse.call(null, value)
            this._assessment.sample(value)
        }
    }
}

Average.prototype.stop = function (callback) {
    callback()
}
