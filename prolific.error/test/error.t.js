require('proof')(1, (okay) => {
    const Prolific = { Error: require('..') }
    okay(new Prolific.Error() instanceof Error, 'is error')
})
