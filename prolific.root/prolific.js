try {
    module.exports = require.main.require('prolific.main')
} catch (e) {
    module.exports = require('prolific.main')
    module.exports.setLevel('error')
}
