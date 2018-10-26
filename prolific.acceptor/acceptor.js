var LEVEL = require('prolific.level')
var Evaluator = require('prolific.evaluator')

var coalesce = require('extant')

function Acceptor (accept, chain) {
    this._chain = []
    this._append([{ path: '.', accept: !! accept }])
    this._append(chain)
    this._chain.reverse()
}

Acceptor.prototype._createContext = function (path, level, properties) {
    for (var i = 1, I = properties.length; i < I; i++) {
        for (var key in properties[i]) {
            properties[0][key] = properties[i][key]
        }
    }
    return {
        level: level,
        formatted: [],
        json: properties[0]
    }
}

Acceptor.prototype._test = function (i, context) {
    var level = context.level, path = context.json.qualifier
    for (var I = this._chain.length; i < I; i++) {
        var link = this._chain[i]
        if (
            context.level <= link.level &&
            (
                link.path === '' ||
                link.path === path ||
                (
                    path.startsWith(link.path) &&
                    path[link.path.length] == '.'
                )
            ) &&
            (link.test == null || link.test(context))
        ) {
            return link.accept
        }
    }
}

Acceptor.prototype.acceptByProperties = function (properties) {
    var path = properties[0].qualifier
    var level = LEVEL[properties[0].level]
    for (var i = 0, I = this._chain.length; i < I; i++) {
        var link = this._chain[i]
        if (level <= link.level) {
            if (
                link.path === '' ||
                link.path === path ||
                (
                    path.startsWith(link.path) &&
                    path[link.path.length] == '.'
                )
            ) {
                if (link.test == null) {
                    if (! link.accept) {
                        return null
                    }
                    return this._createContext(path, level, properties)
                }
                var context = this._createContext(path, level, properties)
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
        var path = coalesce(chain[i].path, ''), level = 7, test = null
        if (path[0] == '.') {
            path = path.substring(1)
        }
        if (chain[i].level != null) {
            level = LEVEL[chain[i].level]
        }
        if (chain[i].test != null) {
            test = Evaluator.create(chain[i].test)
        }
        this._chain.push({
            path: path,
            level: level,
            test: test,
            accept: !! chain[i].accept
        })
    }
}

module.exports = Acceptor
