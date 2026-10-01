import asyncio
import configparser
from datetime import datetime, timedelta
from pathlib import Path

import pytest

from egapro import bin


def test_scheduler_does_not_depend_on_aioschedule():
    # aioschedule 0.5.2 passes coroutines to asyncio.wait, a TypeError on Python 3.11+.
    setup = configparser.ConfigParser()
    setup.read(Path(__file__).parent.parent / "setup.cfg")
    assert "aioschedule" not in setup["options"]["install_requires"]
    assert "aioschedule" not in Path(bin.__file__).read_text()


@pytest.mark.parametrize(
    "now,expected",
    [
        (datetime(2026, 10, 1, 23, 0), 3600),
        (datetime(2026, 10, 1, 0, 0, 1), 86399),
        # Exactly at the scheduled time: the run is the current one, wait for tomorrow.
        (datetime(2026, 10, 1, 0, 0), 86400),
        (datetime(2026, 12, 31, 12, 0), 43200),
    ],
)
def test_seconds_until_next_run(now, expected):
    assert bin.seconds_until_next_run(now) == expected


class FakeClock:
    def __init__(self, now, drift=0):
        self.current = now
        self.drift = drift
        self.sleeps = []

    def now(self):
        return self.current

    async def sleep(self, seconds):
        self.sleeps.append(seconds)
        # The event loop may wake up a bit before the wall clock deadline.
        early = self.drift if seconds > self.drift else 0
        self.current += timedelta(seconds=seconds - early)


async def test_run_scheduled_exports_waits_for_midnight_then_runs_once(monkeypatch):
    runs = []

    async def run_all_exports():
        runs.append(clock.now())

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    clock = FakeClock(datetime(2026, 10, 1, 23, 0))
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)
    assert clock.sleeps == [3600]
    assert runs == [datetime(2026, 10, 2, 0, 0)]


async def test_run_scheduled_exports_never_runs_before_midnight(monkeypatch):
    runs = []

    async def run_all_exports():
        runs.append(clock.now())

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    clock = FakeClock(datetime(2026, 10, 1, 23, 0), drift=0.5)
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)
    assert all(run >= datetime(2026, 10, 2) for run in runs)
    assert runs[1] - runs[0] >= timedelta(hours=23, minutes=59)


async def test_run_scheduled_exports_survives_a_failing_export(monkeypatch):
    async def run_all_exports():
        raise RuntimeError("boom")

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    clock = FakeClock(datetime(2026, 10, 1, 23, 0))
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)


async def test_scheduler_loops_and_closes_the_database(monkeypatch):
    calls = []

    async def run_scheduled_exports():
        calls.append("run")
        if calls.count("run") == 2:
            raise asyncio.CancelledError

    async def init():
        calls.append("init")

    async def terminate():
        calls.append("terminate")

    monkeypatch.setattr(bin, "run_scheduled_exports", run_scheduled_exports)
    monkeypatch.setattr(bin.loggers, "init", lambda: None)
    monkeypatch.setattr(bin.config, "init", lambda: None)
    monkeypatch.setattr(bin.db, "init", init)
    monkeypatch.setattr(bin.db, "terminate", terminate)
    with pytest.raises(asyncio.CancelledError):
        await bin.scheduler()
    assert calls == ["init", "run", "run", "terminate"]
