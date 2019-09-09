describe('tmp', () => {
    const assert = require('assert')
    const fs = require('fs').promises
    const rimraf = require('rimraf')
    const path = require('path')
    const callback = require('prospective/callback')
    it('can create a temp file', async () => {
        const TMPDIR = path.join(__dirname, 'tmp')
        await callback(callback => rimraf(TMPDIR, callback))
        const tmp = require('../tmp')
        await fs.mkdir(TMPDIR)
        await fs.chmod(TMPDIR, 0o1777)
        await fs.writeFile(path.join(TMPDIR, `prolific-${1}-${0}`), '')
        let random = 0
        const tmpdir = tmp(TMPDIR, () => random++, 1)
        assert(tmpdir, path.join(TMPDIR, 'prolific-1-1'), 'tmpdir')
    })
})
