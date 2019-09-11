const children = require('child_process')

const child = children.spawn('node', [ './node.js' ])

const chunks = []
child.stderr.on('data', data => chunks.push(data))
child.stderr.on('end', () => {
    console.log('closed')
    console.log(Buffer.concat(chunks).toString())
})
