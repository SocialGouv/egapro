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

    async def run_all_exports(**kwargs):
        runs.append(clock.now())

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    clock = FakeClock(datetime(2026, 10, 1, 23, 0))
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)
    assert clock.sleeps == [3600]
    assert runs == [datetime(2026, 10, 2, 0, 0)]


async def test_run_scheduled_exports_never_runs_before_midnight(monkeypatch):
    runs = []

    async def run_all_exports(**kwargs):
        runs.append(clock.now())

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    clock = FakeClock(datetime(2026, 10, 1, 23, 0), drift=0.5)
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)
    assert all(run >= datetime(2026, 10, 2) for run in runs)
    assert runs[1] - runs[0] >= timedelta(hours=23, minutes=59)


async def test_run_scheduled_exports_survives_a_failing_export(monkeypatch):
    async def run_all_exports(**kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    clock = FakeClock(datetime(2026, 10, 1, 23, 0))
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)


@pytest.mark.parametrize("configured,expected", [(False, [False]), (True, [True])])
async def test_run_scheduled_exports_publishes_only_once_storage_is_configured(monkeypatch, configured, expected):
    published = []

    async def run_all_exports(publish=True):
        published.append(publish)

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    monkeypatch.setattr(bin.config, "storage_configured", lambda: configured)
    clock = FakeClock(datetime(2026, 10, 1, 23, 0))
    await bin.run_scheduled_exports(now=clock.now, sleep=clock.sleep)
    assert published == expected


async def test_run_all_exports_publishes_each_generated_file(monkeypatch, tmp_path):
    published = []

    async def job(path):
        path.write_text("content")

    async def publish(path, name):
        published.append(name)

    monkeypatch.setattr(bin, "EXPORTS", (("a.csv", job), ("b.csv", job)))
    monkeypatch.setattr(bin.storage, "publish", publish)

    assert await bin.run_all_exports(tmp_path) == []
    assert published == ["a.csv", "b.csv"]


async def test_run_all_exports_reports_a_failed_export_without_publishing_it(monkeypatch, tmp_path):
    published = []

    async def job(path):
        raise RuntimeError("boom")

    async def publish(path, name):
        published.append(name)

    monkeypatch.setattr(bin, "EXPORTS", (("broken.csv", job),))
    monkeypatch.setattr(bin.storage, "publish", publish)

    assert await bin.run_all_exports(tmp_path) == ["broken.csv"]
    assert published == []


async def test_run_all_exports_can_write_the_volume_without_publishing(monkeypatch, tmp_path):
    async def job(path):
        path.write_text("content")

    async def publish(path, name):
        raise AssertionError("should not publish")

    monkeypatch.setattr(bin, "EXPORTS", (("a.csv", job),))
    monkeypatch.setattr(bin.storage, "publish", publish)

    assert await bin.run_all_exports(tmp_path, publish=False) == []
    assert (tmp_path / "a.csv").read_text() == "content"


async def test_publish_exports_generates_in_a_temporary_directory_and_cleans_it(monkeypatch):
    seen = []

    async def run_all_exports(directory, publish=True):
        seen.append((directory, publish, directory.exists()))
        return []

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    monkeypatch.setattr(bin.config, "storage_settings", lambda: object())

    await bin.publish_exports()

    directory, publish, existed = seen[0]
    assert publish is True
    assert existed is True
    assert directory.exists() is False


async def test_publish_exports_fails_on_a_partial_run(monkeypatch):
    async def run_all_exports(directory, publish=True):
        return ["dgt.xlsx"]

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    monkeypatch.setattr(bin.config, "storage_settings", lambda: object())

    with pytest.raises(SystemExit) as exit_error:
        await bin.publish_exports()
    assert exit_error.value.code == 1


async def test_publish_exports_refuses_to_generate_without_storage_configuration(monkeypatch):
    async def run_all_exports(directory, publish=True):
        raise AssertionError("should not generate anything")

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    for key in bin.config.storage_keys:
        monkeypatch.setattr(bin.config, key, "")

    with pytest.raises(RuntimeError, match="S3_ENDPOINT"):
        await bin.publish_exports()


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
