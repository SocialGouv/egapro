from datetime import datetime, timedelta

import pytest
import aioschedule as schedule

from egapro.bin import run_due_jobs


@pytest.mark.asyncio
async def test_due_export_job_runs_on_python_312():
    calls = []

    async def export():
        calls.append("exported")

    schedule.clear()
    try:
        job = schedule.every().day.at("00:00").do(export)
        job.next_run = datetime.now() - timedelta(seconds=1)
        await run_due_jobs()
        assert calls == ["exported"]
    finally:
        schedule.clear()


@pytest.mark.asyncio
async def test_failed_job_does_not_stop_other_due_jobs():
    calls = []

    async def fail():
        raise RuntimeError("failed export")

    async def succeed():
        calls.append("exported")

    schedule.clear()
    try:
        for function in (fail, succeed):
            job = schedule.every().day.at("00:00").do(function)
            job.next_run = datetime.now() - timedelta(seconds=1)
        await run_due_jobs()
        assert calls == ["exported"]
    finally:
        schedule.clear()
