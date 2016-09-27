var line = []
for (var i = 0; i < 100000; i++) {
    line.push('another line and this line is line number ' + i)
}
throw new Error(line.join('\n'))
