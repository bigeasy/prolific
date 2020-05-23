## Fri May 22 22:12:45 CDT 2020

Assumptions in no particular order.

A write to the temporary directory, being synchronous, will be complete before
the program exits. Perhaps there are file system flush timing issues and we'll
have to make sure that the Watcher will retry reading a file that doesn't match
its checksum.

The exit killer will watch a pid *hard* for exit using the operating system. It
gets notified by a 'closed' message from the sidecar. The sidecar detects that
the socket has closed. The watcher will harvest any remaining messages.

Rube Goldberg would be proud.

The start killer is just watching the child start up, but I don't know why I'm
not using just a single killer for all watching since it has a function called
`unwatch` and all the start killer does is message the exit killer.

We seem to be destroying the watcher while it still needs to watch for messages
from sidecars. These are `say` messages, logging messages that come from
sidecars.

The shuttle in a program ought to be able to open a socket and send a header
most of the time. It will definately write out its start message. Possible race
condition if a child of the monitored process is starting when the child exits,
its sidecar exits and the countdown goes to zero. We could wait for the watcher
to drain before destroying the killers, the rest of the file watch apparatus,
but we'll still have a race where the directory has drained and there is still a
write coming. Perhaps the orphaned child process is dithering before starting
the shuttle.

We could play around with process groups, start the child detached. Then we can
signal TERM and we can also look for when the number of processes reaches zero
with `kill`. Don't know if this works in Windows. Didn't I decide that I'm not
going to actively support Windows, ever? If I can implement this using
properties of Node.js then there ought to be no reason to worry about Windows,
that's a Node.js problem.

Start will be written or it won't. It's practically atomic. A process group will
be zero and once it is zero it won't grow again. Still there's a race if the
user creates detatched processes, but when the child exits, we can simply use
the negated pid on all outstanding processes, so now we're only missing a
lagging detached process.

This belongs in the diary.

## Thu May 21 18:38:07 CDT 2020

Seems that there are some problems with shutting down to soon. The child process
now starts it's operations by connecting directly a server running in the
monitor. The monitor will respond to a socket request and start running a
sidecar to handle that socket. I've written a demo program that sends a single
message and exits, so it does create the socket, but the exit comes so quickly
that shutdown is in process when the socket opening begins. But, how far delayed
is the socket opening, can I increment then?

## Mon May 11 03:19:49 CDT 2020

Had a thought that Prolific should handle HUP, but then realized it would
intercept a HUP destined for the monitored application.

Then I thought that Prolific should generate a PID file for the user to find
the right PID to HUP, like other UNIX monitor programs, but then realized that I
want to be able to run Prolific from the command line and I do want signals to
work there.

Wait. Why not just have Prolific's signals work there? Just TERM and INT?

Oh, and for the most part I'll be running Prolific in Kubernetes, so I'll want
to have TERM sent directly to the root process.

Wait. That's no different than having a single term handler. If I want to HUP
that would be for using something like Consul Template to regenerate application
config files and HUP and it would necessarily want to use a PID from a file.

## Wed Sep  4 09:19:21 CDT 2019

Regarding the processor argument.

I've considered two things with this and decided against both.

First, because it is a required argument, you're tempted to remove the switch
and make the processor the first positional argument. Don't do that. The switch
implies RW that the processor is an argument, a variable, and not an end in
itself. You've gotten too funky with this in the past. Positional arguments tend
to verbs or subjects, while the processor is a modifier or an indirect object.
It might imply a search path for the processor when we seem TK to be leaning
toward making it absolute. It is a configuration file.

Second, you've considered using the `NODE_PATH` to find it, but that makes it
part of your program, implies that it is a library. The path is absolute and the
`require` will be rooted in the same directory as the executable (after
resolving all symlinks.) To unit test we'll provide a loader that takes a path
to use as a base. It will be funky, but everything will indicate that this is
the in practice.


## Fri Jul 13 01:23:51 CDT 2018

Remove single operation. Noticing that I don't have a way to specify inherited
handles or pass through IPC when running prolific in the IPC mode.

Some thoughts.

Could reintroduce the `ipc` and `inherit` flags. Concerned that Descendent is
going to cause messages to propagate up and out when the target address is `0`,
so I'm trying to imagine how to preserve that broadcast but uses namespaces to
prevent them from going past prolific, or else get rid if it and insist on
sending a target pid to a child, probably through an environment variable.

Or else someone finds some way to stop propagation.

Or else propagation is made explicit? Then you lose the paths you created.
