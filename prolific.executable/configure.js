function configure (env, configuration) {
    if (configuration == null) {
        configuration = { processors: [] }
    } else if (/^\s*{/.test(configuration)) {
        configuration = JSON.parse(configuration)
    } else if (configuration == 'inherit') {
        configuration = 'PROLIFIC_CONFIGURATION'
    } else {
        configuration = env[configuration]
    }
    if (typeof configuration == 'object') {
        var defaults = {
            processors: [],
            levels: []
        }
        for (var key in defaults) {
            if (!(key in configuration)) {
                configuration[key] = defaults[key]
            }
        }
        return configuration
    }
    return configure(env, configuration)
}

module.exports = configure
