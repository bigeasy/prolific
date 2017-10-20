function Processor (parameters, next) {
    this._labels = parameters.labels
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    this._labels.forEach(function (label) {
        entry.json[label.name] = label.value
    })
    this._next.process(entry)
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
