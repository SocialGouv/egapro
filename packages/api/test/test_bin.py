import pytest

from egapro import bin


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


async def test_publish_exports_generates_in_a_temporary_directory_and_cleans_it(monkeypatch):
    seen = []

    async def run_all_exports(directory):
        seen.append((directory, directory.exists()))
        return []

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    monkeypatch.setattr(bin.config, "storage_settings", lambda: object())

    await bin.publish_exports()

    directory, existed = seen[0]
    assert existed is True
    assert directory.exists() is False


async def test_publish_exports_fails_on_a_partial_run(monkeypatch):
    async def run_all_exports(directory):
        return ["dgt.xlsx"]

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    monkeypatch.setattr(bin.config, "storage_settings", lambda: object())

    with pytest.raises(SystemExit) as exit_error:
        await bin.publish_exports()
    assert exit_error.value.code == 1


async def test_publish_exports_refuses_to_generate_without_storage_configuration(monkeypatch):
    async def run_all_exports(directory):
        raise AssertionError("should not generate anything")

    monkeypatch.setattr(bin, "run_all_exports", run_all_exports)
    for key in bin.config.storage_keys:
        monkeypatch.setattr(bin.config, key, "")

    with pytest.raises(RuntimeError, match="S3_ENDPOINT"):
        await bin.publish_exports()
