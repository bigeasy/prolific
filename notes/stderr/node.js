const alphabet = 'abcdefghijklmnopqrstuvwxyz'
const buffer = []

for (let i = 0; i < 1000000; i++) {
    buffer.push(alphabet)
}

function main () {
    throw "This is an error."
}

process.on('uncaughtException', (error) => {
    const fs = require('fs')
    const prolific_exception_finder = buffer.map((line, index) => `${index} ${line}`).join('\n')
    console.error(prolific_exception_finder)
    console.error('hello')
    fs.writeFileSync('x', prolific_exception_finder)
    process.stderr.write('hello')
    throw prolific_exception_finder
})

main()
