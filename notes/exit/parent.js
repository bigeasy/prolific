async function main () {
    const children = require('child_process')

    const child = children.spawn('node', [ 'child', process.argv[2] || '' ], { stdio: 'inherit' })

    if (process.argv[2].startsWith('SIG')) {
        setTimeout(() => {
            console.log('will kill')
            process.kill(child.pid, process.argv[2])
        }, 750)
    }

    const [ exit, signal ] = await new Promise(resolve => child.on('exit', (...vargs) => resolve(vargs)))

    console.log(exit, signal)
}

main()
