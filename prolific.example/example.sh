#!/bin/bash

prolific run node program.bin.js
prolific run -- node program.bin.js

prolific run \
    tcp --url tcp://127.0.0.1:8514 \
    syslog --application foo --serialize wafer \
  tee \
    tcp --url tcp://127.0.0.1:514 \
    node parent.bin.js --param value prolific run node child.bin.js

# TODO Some sort of language to include modules, so I can stop poluting the name
# space with shortly-thereafter renames.
prolific \
    tcp://127.0.0.1:8514 \
    syslog --application paxos --serialize wafer \
  tee \
    tcp://127.0.0.1:514 \
    @prolific.monitor/filter +'$context[3] == "bigeasy.paxos" && $level <= $trace' \
    aggregate --with 'bigeasy.service:health' --avg 'http=$.http.mean' --sum 'messages=$.messages' \
  node parent.bin.js --param value prolific --configuration inherit node child.bin.js
