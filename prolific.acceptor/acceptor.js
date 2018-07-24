var LEVEL = {
    panic: 0,
    emerg: 0,
    alert: 1,
    crit: 2,
    err: 3,
    error: 3,
    warning: 4,
    warn: 4,
    notice: 5,
    info: 6,
    debug: 7
}

function Acceptor (accept, chain) {
    this._root = {}
    this._append([{ path: '.', accept: !! accept }])
    this._append(chain)
}

function select (entry, path) {
    var objects = [ entry ]
    for (var i = 0, I = path.length; i < I; i++) {
        var expanded = []
        for (var j = 0, J = objects.length; j < J; j++) {
            var value = objects[j][path[i]]
            if (value != null) {
                if (Array.isArray(value)) {
                    Array.prototype.push.apply(expanded, value)
                } else {
                    expanded.push(value)
                }
            }
        }
        objects = expanded
    }
    return objects
}

Acceptor.prototype.accept = function (entry) {
    var path = ('.' + entry[0].qualifier + '.').split('.'), accept = false
    var i = 0
    var node = this._root
    var links = []
    for (;;) {
        var child = node[path[i]]
        if (child == null) {
            break
        }
        Array.prototype.push.apply(links, child['.links'])
        node = child
        i++
    }
    ACCEPT: for (;;) {
        var link = links.pop()
        if (link.level == null || LEVEL[entry[0].level] <= LEVEL[link.level]) {
            if (link.test == null) {
                accept = !! link.accept
                break ACCEPT
            }
            TEST: for (var i = 0, I = link.test.length; i < I; i++) {
                var test = link.test[i]
                var values = []
                for (var j = entry.length - 1; j != -1 && values.length == 0; j--) {
                    values = select(entry[j], test.path)
                }
                switch (test.type) {
                case 'equals':
                    for (var j = 0, J = values.length; j < J; j++) {
                        if (values[j] == test.equals) {
                            continue TEST
                        }
                    }
                    continue ACCEPT
                case 'regex':
                    for (var j = 0, J = values.length; j < J; j++) {
                        if (test.regex.test(values[j])) {
                            continue TEST
                        }
                    }
                    continue ACCEPT
                }
            }
            accept = !! link.accept
            break ACCEPT
        }
    }
    return accept
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
            link.test.forEach(function (condition) {
                condition.path = condition.path.split('.')
                if (condition.equals) {
                    condition.type = 'equals'
                } else if (condition.regex) {
                    var regex = /^\/(.*)\/(?!.*(.).*\2)([gimuy]*)$/.exec(condition.regex)
                    condition.type = 'regex'
                    condition.regex = new RegExp(regex[1], regex[3])
                } else {
                    throw new Error('invalid test')
                }
            })
        }
        node['.links'].push(link)
    }
}

module.exports = Acceptor
