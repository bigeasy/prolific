var LEVEL = require('prolific.level')
var Evaluator = require('prolific.evaluator')

var coalesce = require('extant')

function Acceptor (accept, chain) {
    this._chain = []
    this._append([{ path: '.', accept: !! accept }])
    this._append(chain)
    this._chain.reverse()
}

Acceptor.prototype._createContext = function (path, parts, level, properties) {
    var qualifier = parts.map(function (value, index, array) {
        return array.slice(0, index + 1).join('.')
    })
    qualifier.unshift(null)
    for (var i = 1, I = properties.length; i < I; i++) {
        for (var key in properties[i]) {
            properties[0][key] = properties[i][key]
        }
    }
    return {
        path: path,
        level: level,
        qualifier: qualifier,
        formatted: [],
        json: properties[0]
    }
}

Acceptor.prototype._test = function (i, context) {
    for (var I = this._chain.length; i < I; i++) {
        var link = this._chain[i]
        if (
            context.level <= link.level &&
            context.qualifier[link.index] == link.part &&
            (link.test == null || link.test(context))
        ) {
            return link.accept
        }
    }
}

Acceptor.prototype.acceptByProperties = function (properties) {
    var path = ('.' + properties[0].qualifier + '.').split('.')
    for (var i = 0, I = this._chain.length; i < I; i++) {
        var link = this._chain[i]
        var parts = properties[0].qualifier.split('.')
        if (link.part == null || parts.slice(0, link).join('.') == link.part) {
            var level = LEVEL[properties[0].level]
            if (level <= link.level) {
                if (link.test == null) {
                    if (! link.accept) {
                        return null
                    }
                    return this._createContext(path, parts, level, properties)
                }
                var context = this._createContext(path, parts, level, properties)
                if (link.test(context)) {
                    return link.accept ? context : null
                }
                if (this._test(i + 1, context)) {
                    return context
                }
                return null
            }
        }
    }
}

Acceptor.prototype.acceptByContext = function (context) {
    return this._test(0, context)
}

Acceptor.prototype._append = function (chain) {
    for (var i = 0, I = chain.length; i < I; i++) {
        var path = coalesce(chain[i].path, ''), part = null, index = 0, level = 7, test = null
        if (path != '.') {
            index = path.split('.').length - 1
            part = path.substring(1)
        }
        if (chain[i].level != null) {
            level = LEVEL[chain[i].level]
        }
        if (chain[i].test != null) {
            test = Evaluator.create(chain[i].test)
        }
        this._chain.push({
            index: index,
            part: part,
            level: level,
            test: test,
            accept: !! chain[i].accept
        })
    }
}

module.exports = Acceptor
