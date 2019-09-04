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
