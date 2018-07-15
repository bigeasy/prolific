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
