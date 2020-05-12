require('proof')(2, async function (okay) {
    const test = []
    const Dropper = require('../dropper')
    const dropper = new Dropper({
        say: (...vargs) => test.push(vargs)
    }, 50)
    await new Promise(resolve => setTimeout(resolve, 75))
    okay(test.length, 0, 'nothing dropped')
    dropper.process([ 1 ])
    await new Promise(resolve => setTimeout(resolve, 75))
    okay(test, [[ 'dropped', { dropped: 1 } ]], 'dropped')
    dropper.terminator.terminate()
})
