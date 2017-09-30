prolific reduce \
    --qualified 'agent#publish' \
    --pivot '$.instance' \
    --calculate '$.duration = end - start' \
    --end '$.terminate' \
    --timeout 3000
