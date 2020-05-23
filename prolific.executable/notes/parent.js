const path = require('path')

console.log('parent', process.pid)

const once = require('prospective/once')

const attached = !! process.argv[2]

async function main () {
    const children = require('child_process')

    const child = children.spawn('node', [ path.join(__dirname, 'child.js') ], {
        detached: ! attached,
        stdio: [ 0, 'inherit', 'inherit' ]
    })

    process.on('SIGINT', () => process.kill(attached ? child.pid : -child.pid, 'SIGTERM'))

    console.log(process.kill(child.pid, 0))
    try {
        console.log(process.kill(-child.pid, 0))
    } catch (error) {
        if (error.code != 'ESRCH') {
            throw error
        }
        console.log('no pgid kill')
    }

    const interval = setInterval(() => {
        try {
            console.log(process.kill(attached ? child.pid : -child.pid, 0))
        } catch (error) {
            if (error.code != 'ESRCH') {
                throw error
            }
            console.log('died')
            clearInterval(interval)
        }
    }, 1000)

    console.log(await once(child, 'exit').promise)

}

main()
