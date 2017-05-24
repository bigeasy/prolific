require('arguable')(module, require('cadence')(function (async, program) {
    var configuration = JSON.parse(program.ultimate.configuration)
    var pipeline = new Pipeline(configuration)
    var destructible = new Destructible('monitor')
    program.on('shutdown', destructible.destroy.bind(destructible))
    cadence(function (async) {
        async([function () {
            pipeline.close(async())
        }], function () {
            pipeline.open(async())
        }, function () {
            async([function () {
                delta(async())
                    .ee(child).on('exit')
                    .ee(pipe).on('end')
            }, function (error) {
// TODO Revisit this. Which operating system generated this error?
// Error was ECONNRESET.
                child.kill()
                console.log(error.stack)
                return 1
            }])
        }, function (code, signal) {
// TODO Now I need to get the information down into this bit. Do I know when
// I've reached the end of a child in a paritcular stream?
//
// Send it down the IPC channel. No, don't use Conduit. The buffer is going to
// be plain text anyway, right? You can base 64 encode it if it is going to make
// you feel better. We do have an EOS now.
            async(function () {
            }, function () {
            })
        })
    })(abend)
    return []
})
