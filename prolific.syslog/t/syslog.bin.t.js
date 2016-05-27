require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var bin = require('../syslog.bin')
    var path = require('path')

    // Create a pseudo Prolific Shuttle. Why? I'd like to have a meaningful
    // test, one where I test the output of the function. I could just run the
    // test, cover the branches (there currently aren't any), and assume that
    // the configuration is correct. With this, I'd get my test coverage. But,
    // it doesn't feel like a test without a proper assertion.
    //
    // The output of the main module is difficult to gather however. The output
    // of the main module is written to the parent using the Prolific logging
    // pipe between the Prolific monitor acting as the parent and the child
    // created by `child_process.spawn()` in the child. In the child the pipe is
    // exposed as a file descriptor. The child must create a `net.Socket` around
    // the file descriptor. This is what `prolific.shuttle` does.
    //
    // In order to gather the output written to this socket, I'd have to create
    // a file descriptor for a socket by creating a TCP server and a client,
    // assign the file descriptor to the `PROLIFIC_CONFIGURATION` environment,
    // then run the function with the assertion on the server-side of the TCP
    // server. No big whoop.
    //
    // However, I can't determine if file descriptors are as universal in the
    // Windows implementation of Node.js. No good reason to care about Windows
    // specifically. More concerned about staying within a level abstraction.
    // The child pipe works. If Prolific moves to a new platform I'll be
    // motivated to make it work. I'm not going to be as motivated to make a
    // faked out child pipe work. Having this purity in the tests would prevent
    // me from making progress on a port.
    //
    // Thus, I've gone and added a way to create mock interfaces and provide
    // them to your program through Arguable. The mechanism can be seen below.
    //
    // Ordinarily, when I want to mock a whole library, I create a builder
    // function and feed it pseudo values, but I'd rather run things through
    // Arguable because the pseudo value is going to be an Arguable `Program`
    // object and Arguable builds those easier than I can mock them.
    //
    // So, here we inaugurate Arguable's patchable `require`.

    function Shuttle () {
    }

    Shuttle.shuttle = function (program, interval, configuration, logger) {
        assert(configuration, {
            moduleName: 'prolific.syslog/syslog',
            url: 'syslog?application=application&hostname=www.prettyrobots.com'
        }, 'configuration')
    }

    async(function () {
        var io
        io = bin([ '--application', 'application', '--host', 'www.prettyrobots.com' ], {
            require: { 'prolific.shuttle': Shuttle }
        }, async())
        io.events.emit('SIGTERM')
    }, function (code) {
        assert(code, 0, 'no configuration')
    })
}
