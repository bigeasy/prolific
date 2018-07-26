var LEVEL = require('prolific.level')
var Evaluator = require('prolific.evaluator')

function Acceptor (accept, chain) {
    this._root = {}
    this._append([{ path: '.', accept: !! accept }])
    this._append(chain)
}

Acceptor.prototype._chain = function (path) {
    var i = 0
    var node = this._root
    var chain = []
    for (;;) {
        var child = node[path[i]]
        if (child == null) {
            break
        }
        Array.prototype.push.apply(chain, child['.links'])
        node = child
        i++
    }
    return chain
}

Acceptor.prototype._createContext = function (path, level, properties) {
    var qualifier = properties[0].qualifier.split('.').map(function (value, index, array) {
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

Acceptor.prototype._test = function (chain, context) {
    for (;;) {
        var link = chain.pop()
        if (link.level == null || context.level <= LEVEL[link.level]) {
            if (link.test == null) {
                return !! link.accept
            } else if (link.test(context)) {
                return true
            }
        }
    }
}

Acceptor.prototype.acceptByProperties = function (properties) {
    var path = ('.' + properties[0].qualifier + '.').split('.')
    var chain = this._chain(path)
    var level = LEVEL[properties[0].level]
    for (;;) {
        var link = chain.pop()
        if (link.level == null || level <= LEVEL[link.level]) {
            if (link.test == null) {
                if (! link.accept) {
                    return null
                }
                return this._createContext(path, level, properties)
            } else {
                var context = this._createContext(path, level, properties)
                if (link.test(context)) {
                    return context
                }
                if (this._test(chain, context)) {
                    return context
                }
                return null
            }
        }
    }
}

Acceptor.prototype.acceptByContext = function (context) {
    return this._test(this._chain(context.path), context)
}

Acceptor.prototype._append = function (chain) {
    for (var i = 0, I = chain.length; i < I; i++) {
        var link = chain[i]
        var path = link.path == '.' ? [ '' ] : link.path.split('.')
        var node = this._root
        for (var j = 0, J = path.length; j < J; j++) {
            if (!node[path[j]]) {
                node[path[j]] = { '.links': [] }
            }
            node = node[path[j]]
        }
        if (link.test != null) {
            link.test = Evaluator.create(link.test)
        }
        node['.links'].push(link)
    }
}

module.exports = Acceptor
