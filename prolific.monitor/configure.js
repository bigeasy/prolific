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
        if (configuration.processors == null) {
            configuration.processors = []
        }
        return configuration
    }
    return configure(env, configuration)
}

module.exports = configure
