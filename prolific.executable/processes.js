function Tree (pid) {
    this._tree = { children: {} }
    this._tree.children[pid] = { pid: pid, children: {} }
}

Tree.prototype.put = function (path) {
    var node = this._tree
    for (var i = 0, I = path.length; i < I; i++) {
        if (node.children[path[i]] == null) {
            node = node.children[path[i]] = { pid: path[i], children: {} }
        } else {
            node = node.children[path[i]]
        }
    }
}

function values (object) {
    var values = []
    for (var key in object) {
        values.push(object[key])
    }
    return values
}

Tree.prototype.processes = function (path) {
    var node = this._tree
    for (var i = 0, I = path.length; node != null && i < I; i++) {
        node = node.children[path[i]]
    }
    if (node == null) {
        return []
    }
    var pids = [ node.pid ], stack = values(node.children)
    while (stack.length != 0) {
        node = stack.shift()
        pids.push(node.pid)
        stack.push.apply(stack, values(node.children))
    }
    return pids
}

Tree.prototype.prune = function (path) {
    var node = this._tree
    for (var i = 0, I = path.length - 1; node != null && i < I; i++) {
        node = node.children[path[i]]
    }
    if (node != null) {
        delete node.children[path[i]]
    }
}

module.exports = Tree
