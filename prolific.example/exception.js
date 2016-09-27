var line = []
for (var i = 0; i < 100; i++) {
    line.push('another line and this line is line number ' + i)
}
process.on('uncaughtException', function () {
    console.log('here')
    process.stderr.write(line.join('\n'))
    throw new Error(line.join('\n'))
})
throw new Error
