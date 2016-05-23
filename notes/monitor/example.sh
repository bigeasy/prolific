prolific server --bind tcp://127.0.0.1:4444

prolific monitor --url tcp://127.0.0.1:8514 \
    prolific wafer \
    prolific average --context=bigeasy.summary \
                     --record=bigeasy.something/foo \
                     --value=entry.http.duration \
    prolific average --context=bigeasy.summary \
                     --record=bigeasy.something/foo \
                     --value=entry.http.duration \
    prolific listen --url tcp://127.0.0.1:4444 --buffer average

prolific monitor --url tcp://127.0.0.1:8514 \
    prolific wafer \
    prolific filter --name=level --level=info \
    prolific listen --url tcp://127.0.0.1:4444 --buffer level

prolific server --bind tcp://127.0.0.1:4444

prolific monitor --url tcp://127.0.0.1:8514 \
    prolific wafer \
    prolific filter --name=level --level=info \
    prolific average --context=bigeasy.summary \
                     --record=bigeasy.something/foo \
                     --value=entry.http.duration \
    prolific average --context=bigeasy.summary \
                     --record=bigeasy.something/foo \
                     --value=entry.http.duration \
    prolific tee --url tcp://127.0.0.1:5555 \
    node myprogram.js

prolific monitor --url tcp://127.0.0.1:8514 \
    prolific wafer \
    prolific listen --url tcp://127.0.0.1:4444 --buffer level
