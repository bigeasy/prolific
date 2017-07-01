var coalesce = require('extant')

function Processor (parameters, next) {
    this._next = next
}

Processor.prototype.open = function (callback) { callback() }

Processor.prototype.process = function (entry) {
    if (/^(count|measure|sample)$/.test(entry.json.l2met)) {
        var json = entry.json
        var formatted = [ json.l2met.substring(0, 1), '#', json.name, '=', json.value, coalesce(json.unit, '') ]
        var separator = ' tags='
        for (var name in json.tags || {}) {
            var value = json.tags[name]
            formatted.push(separator, name, ':', value)
            separator = ','
        }
        formatted.push('\n')
        entry.formatted.push(formatted.join(''))
    }
    this._next.process(entry)
}

Processor.prototype.close = function (callback) { callback() }

module.exports = Processor
