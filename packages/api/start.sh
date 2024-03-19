#!/bin/bash
export PYTHONUNBUFFERED=TRUE

if [ "$SCHEDULER" = "True" ]; then
    exec egapro scheduler
else
    exec gunicorn egapro.views:app -b 0.0.0.0:2626 --access-logfile=- --log-file=- --timeout 600 --worker-class roll.worker.Worker
fi
