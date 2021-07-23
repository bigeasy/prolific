const fs = require('fs').promises
const path = require('path')
const assert = require('assert')

module.exports = async function (tmp, random, pid) {
    for (;;) {
        const umask = process.umask(0o077)
        try {
            const dirname = path.join(tmp, `prolific-${pid}-${await random()}`)
            await fs.mkdir(dirname)
            return dirname
        } catch (error) {
            // TODO Use rescue?
            assert(error.code == 'EEXIST')
        } finally {
            process.umask(umask)
        }
    }
}
