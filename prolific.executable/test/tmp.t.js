require('proof')(1, async (okay) => {
    const fs = require('fs').promises
    const path = require('path')
    const TMPDIR = path.join(__dirname, 'tmp')
    await (fs.rm || fs.rmdir).call(fs, TMPDIR, { force: true, recursive: true })
    const tmp = require('../tmp')
    await fs.mkdir(TMPDIR)
    await fs.chmod(TMPDIR, 0o1777)
    await fs.writeFile(path.join(TMPDIR, `prolific-${1}-${0}`), '')
    let random = 0
    const tmpdir = await tmp(TMPDIR, () => random++, 1)
    okay(tmpdir, path.resolve(TMPDIR, 'prolific-1-1'), 'tmpdir')
})
