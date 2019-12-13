const path = require('path')

const alphabet = 'abcdefghijklmnopqrstuvwxyz'

function main () {
    throw new Error('thrown')
}

process.on('uncaughtException', error => {
    const fs = require('fs')
    const fatal = new Array(1000000).fill(alphabet).map((line, i) => `${i} ${line}`)
    fatal.push('')
    fs.writeFileSync(path.resolve(__dirname, 'fatal'), fatal.join('\n'))
    throw error
})

main()
