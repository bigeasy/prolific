require('proof')(2, prove)

function prove (okay) {
    var Evaluator = require('..')
    var modularized = require('./modularized')
    var triage = Evaluator.create(modularized.triage.toString(), require)
    okay(triage(0, { label: 'acceptable' }), true, 'created')
    okay(Evaluator.create(modularized.broken, require), null, 'failed')
}
