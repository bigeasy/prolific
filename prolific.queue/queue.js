const assert = require('assert')
const fnv = require('hash.fnv')
const Staccato = require('staccato')
const fs = require('fs')
const path = require('path')
const byline = require('byline')
const events = require('events')
const once = require('prospective/once')

class Queue extends events.EventEmitter {
    constructor (Date, directory, pid, interval) {
        super()
        this._directory = directory
        this._interval = interval
        this._series = 0xffffff
        this._start = Date.now()
        this._entries = []
        this._unlatched = null
        this._latch = () => {}
        this._batches = []
        this._written = []
        this._readable = { destroy: () => {} }
        this._writable = { destroy: () => {} }
        this._recieving = new Promise(resolve => this._received = resolve)
        this._writing = true
        this._sync = false
        this._exited = false
        this._pid = pid
        this._Date = Date
        this._publish({ method: 'start' })
    }

    _publish (body) {
        const buffer = Buffer.from(JSON.stringify({
            start: this._start,
            pid: this._pid,
            series: this._syncSeries = (this._syncSeries + 1) & 0xffffff,
            when: this._Date.now(),
            body: body
        }))
        const hash = Number(fnv(0, buffer, 0, buffer.length)).toString(16)
        const filename = `prolific-${this._pid}-${this._Date.now()}-${hash}.json`
        const files = {
            stage: path.resolve(this._directory, 'stage', filename),
            publish: path.resolve(this._directory, 'publish', filename)
        }
        fs.writeFileSync(files.stage, buffer)
        fs.renameSync(files.stage, files.publish)
    }

    _batchEntries () {
        const entries = this._entries
        if (entries.length == 0) {
            return
        }
        this._entries = []
        this._batches.push({
            method: 'entries',
            series: this._series = (this._series + 1) & 0xffffff,
            entries: entries
        })
    }

    // Flush logs to the dedicated logging pipe. Chunks entries so that we can send
    // many lines in a single chunk. Then writes. When it comes back from a write it
    // checks to see if the pipe has ended and breaks early, otherwise it continues
    // until there are no lines or chunks to _sendAsync.

    // Note that the first time through we're going to not have any entries and
    // wait but we don't want to mark ourselves as not writing because we want to
    // keep `push` from signalling us until we get the pipe.

    // So, first time through we don't mean it.

    //
    async _send (writable) {
        let interval = 0
        await this._receiving
        SEND: for (;;) {
            // We set writing false because from here we either sleep or wait.
            this._writing = false
            if (interval != 0) {
                await new Promise(resolve => {
                    this._timeout = setTimeout(resolve, this._interval)
                    this._timeout.unref()
                })
            }
            interval = this._interval
            await this._unlatched
            this._unlatched = new Promise(resolve => this._latch = resolve)
            if (this._exited) {
                break SEND
            }
            this._batchEntries()
            while (this._batches.length != 0) {
                const batch = this._batches.shift()
                this._written.push(batch)
                await writable.write(JSON.stringify(batch) + '\n')
            }
        }
    }

    _triage (json) {
        this.emit('triage', {
            version: json.version,
            file: json.file,
            source: json.source
        })
    }

    _dispatch (line) {
        const json = JSON.parse(line)
        switch (json.method) {
        case 'receipt':
            assert.equal(this._written[0].series, json.series, 'series mismatch')
            this._written.shift()
            break
        case 'triage':
            this._triage(json)
            break
        }
    }

    // Note that in case of a truncated stream, `byline` will not give us a
    // partial line at the end of file, so we can always count on each line
    // being a full line with a single JSON object.
    async _receive () {
        const line = await this._readable.read()
        if (line != null) {
            this._dispatch(line.toString())
            this._received.call()
            for await (const line of this._readable) {
                this._dispatch(line.toString())
            }
        }
    }

    // Breaking up long buffers.

    //
    _writeSync () {
        this._batchEntries()
        while (this._written.length) {
            const batch = this._written.shift()
            this._publish({ method: 'batch', ...batch })
        }
        while (this._batches.length) {
            const batch = this._batches.shift()
            this._publish({ method: 'batch', ...batch })
        }
    }

    // Set the asynchronous pipe and begin streaming entries or else close the
    // pipe if it has arrived after we've closed.

    // TODO Okay, we won't shutdown the server until after the countdown either,
    // so we will be performing these actions until exit. We assume no errors on
    // this socket because the domain server is going still to be there while
    // we're still here.
    async connect (net, path) {
        this._socket = net.connect(path)
        this._socket.unref()
        await once(this._socket, 'connect').promise
        // Unlikely at runtime since exit will only ever really occur in the
        // exit handler, but we skip loop start up in any case.
        if (this._exited) {
            return []
        }
        this._writable = new Staccato.Writable(this._socket)
        this._readable = new Staccato.Readable(byline(this._socket))
        await this._writable.write(JSON.stringify({ method: 'announce', pid: this._pid }) + '\n')
        // We may have exited, but that's unlikely at runtime, and the loops
        // here will both exit immediately, so we don't have to check for exit.
        return [ this._send(this._writable), this._receive() ]
    }

    _nudge () {
        if (this._exited) {
            this._writeSync()
        } else if (!this._writing) {
            this._writing = true
            this._latch.call()
        }
    }

    version (version) {
        this._batchEntries()
        this._batches.push({
            method: 'version',
            series: this._series = (this._series + 1) & 0xffffff,
            version: version
        })
        this._nudge()
    }

    push (json) {
        this._entries.push(json)
        this._nudge()
    }

    // If you can tell the supervior that you are leaving, that would be very nice.

    //
    exit (code) {
        if (!this._exited) {
            this._exited = true
            this._readable.destroy()
            this._writable.destroy()
            this._received.call()
            this._latch.call()
            this._writeSync()
            this._publish({ method: 'exit', code })
        }
    }
}

module.exports = Queue
