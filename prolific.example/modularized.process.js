module.exports = require('cadence')(function (async, destructible) {
    // Destroy would allow sending to drain. Network senders should have their
    // own queues, maybe those queues report back to our logger.
    var udp = require('prolific.udp')(destructible.monitor('udp'))
    // Reducer would pull from a pool so that a reload would continue to use the
    // same reducer.
    var reducer = require('prolific.reducer')(destructible.monitor('reducer'))
    // Optionally have a callback and then we can do something asynchronous if
    // we must, but we probably want to just cook the entry, format it, and then
    // enqueue it to go out on the network or get written to file. We probably
    // don't want to block on writing here, but why not? We have to block on
    // writing somewhere. Then we can have a single message queue.
    //
    // If it blocks to much we can create parallel queues and select based on an
    // identifier how the messages are queued. Certianly we can have a queue per
    // process that we're monitoring.
    //
    // Actually, when we're not doing UDP we probably do want to allow messages
    // to bunch up for TCP and go out in bursts.
    return cadence(function (async, entry) {
        if (entry.reduction) {
            var reduction = reducer.get(entry.reduction, entry)
            if (reduction.visited == 1) {
                reduction.entry.durations = {}
            } else {
                reduction.entry.durations[entry.label] = entry.when - reduction.entry.when
            }
        }
        if (entry.l2met != null) {
            var tags = {}
            console.log(l2met.format(entry))
            udp.send('udp://127.0.0.1:512', l2met.format(entry), async())
        }
    })
    // This is so much better.
})
