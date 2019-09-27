## Prolific Resolver

Deprecated. Using Foremost. These days `npm` lays out dependencies flat in the
`node_modules` directory so that even if Prolific Logger is used by an
application that doesn't use Prolific, we'll still be able to find the
`prolific.sink` module through the require of the main module. Wasn't always so
easy.

See [Prolific](http://github.com/bigeasy/prolific).
