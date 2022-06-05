# TODO

- [ ] Store deleted Prolific modules in `defunct`. ~ Resurrected to edit their
`README.md` for NPM. Let's not treat this as your greatest gift to posterity.
Just make sure you don't have any spelling errors, maybe add a link.
    - [ ] Delete Prolific Stringify.
- [ ] Complete Prolific pipline removal tidy.
    - [ ] Fix spelling of Deprecated in Prolific modules.
    - [ ] Check that Prolific STDIO's spelling was fixed and delete from
    project.
    - [ ] Ensure that [Prolific STDOUT UDP](https://www.npmjs.com/package/prolific.stdout.udp) has a nicely formatted header and
    delete.
- [ ] Convert Prolific in ES6.
    - [ ] Implement UDP utility in ES6.
    - [ ] Implement HTTP utility in ES6.
    - [ ] Do not stop UDP Turnstile, wait for the queue to empty.
        - [ ] Maybe pushing null onto the Turnstile causes it to close as an end
        of stream, just like Procession.
    - [ ] Flush Prolific pipeline before reloading. ~ You need to flush the
    Prolific pipeline before you reload it. You are currently calling the
    destructible instead of waiting for the processor’s pipeline to empty. How
    do you wait for an empty? Maybe you push `null` into the processor, or maybe
    you push an error of some sort. Oh, wait. No. When you do call it is
    synchronous, isn’t it? So you have already flushed.
    - [ ] Use Future in Prolific Queue.
- [ ] Add slashes to Prolific qualifiers. ~ Seems like this was intended to
allow you to use package names with module paths as qualifiers.
- [ ] Implement Prolific Monitor bunching.
    - [ ] Maybe a selector function.
    - [ ] Command line configuration.
    - [ ] Separate configuration file.
- [ ] Is Prolific not sending a `SIGTERM` to children?
- [ ] Prolfiic L2met should take named parameters.
- [ ] Need some way to indicate source program in Prolific.
- [ ] Maybe Destructible provides a function that will call Destructible if this
is the main method. ~ Because that is where the rubber hits the road, not in
Argauable. Find a new way to test everything in arguable and then use
destructible to create your root.
- [ ] Yes, some sort of crash on overflow for Turnstile.
- [ ] Name the object inside the prolific
- [ ] Rename the object inside the prolific syslog library from processor to
something else.
- [ ] Reimplement Prolific File to use Staccato. ~ Get rid of that dependency on
Prolific Sender Stream.
- [ ] Get rid of Prolific Sender Stream. ~ Requires finishing Prolific File.
- [ ] Implement Prolific Aggregate. ~ Some sort of utility to do running
summaries.
- [ ] Directly monitor standard error in Prolific.
- [ ] Add child registration to Prolific shuttle.
- [ ] Log process details from Prolific monitor.
- [ ] Log process details from Prolific supervisor.
- [ ] Not getting errors reported on immediate error exit in Prolific.
    - [ ] Not getting errors reported on immediate error exit in Prolific. ~
    Throw an error right out the start of `t/program.js` and run tests to see
    what I mean.

Really want the ability to grep logs remotely, gather them and grep them. Where
can they live when they are not local?

I believe we can shuffle them off to S3, and we can have a script that is
running to send them to S3 all the time, and we can run that script right after
we exit. Including S3, we could also shuffle them to a mounted directory in
minikube, so that we know that the write is as fast as it can be in production,
they copy is a second effect.

Maybe we add a prescedence to Olio, so that you can have additional durable
monitors that provide services that you assume are not as fragile. Software
maturity is always a consideration, isn't it?

Correctly drain Prolific pipeline waiting for it to finish before you trigger
Destructible.

You do not want to tell pipelines to close by calling `Destructible.destroy` but
instead wait for them to complete, maybe you call your pipeline function and
assume that it has or maybe there is a shutdown method you call and it calls
drain on all the things that need to drain. Maybe you pass in null to tell
everything that it is time to end, so that you wait on a
`Destructible.completed.wait`.

That last one makes the most sense. Right now, because of your pivot, you don't
really have a way of knowing when the loops have canceled. You need to wait for
your queues to drain but your queues are fire-and-forget or enqueue-and-forget.
You need to push in a `null` so that there is a difference between pushing in a
`null` and quitting otherwise.
