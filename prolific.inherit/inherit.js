module.exports = function (program) {
    var seen = {}
    var stdio = [ 0, 1, 2 ].concat(program.command.params.inherit).map(function (number) {
        return +number
    }).sort(function (a, b) {
        return a - b
    }).filter(function(number) {
        var exclude = seen[number]
        seen[number] = true
        return ! exclude
    })

    for (var i = 0, I = stdio[stdio.length - 1]; i < I; i++) {
        if (stdio[i] != i) {
            stdio.splice(i, 0, 'ignore')
        }
    }

    if (program.command.param.ipc) {
        stdio.push('ipc')
    }

    stdio[2] = stdio[stdio.length + 1] = stdio[stdio.length] = 'pipe'

    return {
        stdio: stdio,
        fd:{
            configuration: stdio.length - 2,
            logging: stdio.length - 1
        }
    }
}
