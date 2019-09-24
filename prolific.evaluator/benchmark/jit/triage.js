function triage () {
    return true
}

const other = {
    triage: function () { return true }
}

const object = {
    f: function () {
        if (other.triage()) {
        }
    }
}

for (let i = 0; i < 1000000000; i++) {
    object.f()
}
