#!/bin/bash
export PYTHONUNBUFFERED=TRUE

if [ "$SCHEDULER" = "True" ]; then
    # Instead of using the egapro command, run Python directly
    exec python -c "import asyncio; from egapro.bin import scheduler; asyncio.run(scheduler())"
else
    exec gunicorn egapro.views:app -b 0.0.0.0:2626 --access-logfile=- --log-file=- --timeout 600 --worker-class roll.worker.Worker
fi
