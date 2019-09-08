switch (process.argv[2]) {
case 'fiddle':
    console.log('>>>', 1 << 8 | require('os').constants.signals.SIGTERM)
    process.exit(1 << 8 | require('os').constants.signals.SIGTERM)
    break
case 'fake':
    setInterval(() => {}, 10000)
    setTimeout(() => {
        process.kill(process.pid, 'SIGINT')
    }, 500)
    break
default:
    setInterval(() => {}, 10000)
    break
}
