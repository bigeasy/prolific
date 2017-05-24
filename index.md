Prolific

 * [Prolific](./root/) ~ Executable.
 * [STDIO](./stdio/) ~ Write to standard error or standard out.
 * [Collector](./collector/) ~ Collect streams from dedicated pipe and stderr.

The parent-child relationship exists to ensure that fatal messages in the child
are caputured though the synchronous standard out stream. Whenever you consider
simplifying Prolific, remember why you did this in the first place.
