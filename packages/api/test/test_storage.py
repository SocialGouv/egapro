import io
import zipfile

import boto3
import pytest
from moto import mock_aws

from egapro import config, storage
from egapro.config import StorageSettings

SETTINGS = StorageSettings(
    endpoint="https://s3.amazonaws.com",
    region="us-east-1",
    bucket="a-bucket",
    prefix="",
    access_key_id="an-access-key",
    secret_access_key="a-secret-key",
)


@pytest.fixture
def s3():
    with mock_aws():
        client = boto3.client(
            "s3",
            region_name="us-east-1",
            aws_access_key_id="an-access-key",
            aws_secret_access_key="a-secret-key",
        )
        client.create_bucket(Bucket="a-bucket")
        yield client


async def test_publish_uploads_the_complete_file(s3, tmp_path):
    path = tmp_path / "indexes.csv"
    path.write_text("siren;year\n123456789;2024\n")

    await storage.publish(path, "indexes.csv", SETTINGS)

    stored = s3.get_object(Bucket="a-bucket", Key="indexes.csv")
    assert stored["Body"].read().decode() == "siren;year\n123456789;2024\n"


async def test_publish_replaces_the_previous_export(s3, tmp_path):
    path = tmp_path / "indexes.csv"
    path.write_text("first")
    await storage.publish(path, "indexes.csv", SETTINGS)

    path.write_text("second, longer")
    await storage.publish(path, "indexes.csv", SETTINGS)

    stored = s3.get_object(Bucket="a-bucket", Key="indexes.csv")
    assert stored["Body"].read().decode() == "second, longer"


async def test_publish_applies_the_prefix(s3, tmp_path):
    path = tmp_path / "indexes.csv"
    path.write_text("content")

    await storage.publish(path, "indexes.csv", SETTINGS._replace(prefix="exports"))

    stored = s3.get_object(Bucket="a-bucket", Key="exports/indexes.csv")
    assert stored["Body"].read().decode() == "content"


async def test_publish_refuses_an_empty_file_and_keeps_the_previous_export(s3, tmp_path):
    path = tmp_path / "dgt.xlsx"
    path.write_bytes(_xlsx_bytes())
    await storage.publish(path, "dgt.xlsx", SETTINGS)

    path.write_bytes(b"")
    with pytest.raises(ValueError, match="empty file"):
        await storage.publish(path, "dgt.xlsx", SETTINGS)

    stored = s3.get_object(Bucket="a-bucket", Key="dgt.xlsx")
    assert stored["Body"].read() == _xlsx_bytes()


async def test_publish_refuses_a_truncated_xlsx_and_keeps_the_previous_export(s3, tmp_path):
    path = tmp_path / "dgt.xlsx"
    path.write_bytes(_xlsx_bytes())
    await storage.publish(path, "dgt.xlsx", SETTINGS)

    path.write_bytes(b"PK\x03\x04 truncated")
    with pytest.raises(ValueError, match="truncated XLSX"):
        await storage.publish(path, "dgt.xlsx", SETTINGS)

    stored = s3.get_object(Bucket="a-bucket", Key="dgt.xlsx")
    assert stored["Body"].read() == _xlsx_bytes()


async def test_publish_streams_from_the_path_instead_of_reading_the_file(monkeypatch, tmp_path):
    path = tmp_path / "full.ndjson"
    path.write_text("a line\n" * 1000)
    calls = []

    class FakeStorage:
        def upload_file(self, filename, bucket, key):
            calls.append((filename, bucket, key))

        def head_object(self, **kwargs):
            return {"ContentLength": path.stat().st_size}

    monkeypatch.setattr(storage, "client", lambda settings: FakeStorage())

    await storage.publish(path, "full.ndjson", SETTINGS)

    assert calls == [(str(path), "a-bucket", "full.ndjson")]


def test_verify_detects_a_size_mismatch(s3, tmp_path):
    path = tmp_path / "indexes.csv"
    path.write_text("a complete export")

    s3.put_object(Bucket="a-bucket", Key="indexes.csv", Body=b"short")

    with pytest.raises(ValueError, match="size mismatch"):
        storage.verify(path, "indexes.csv", SETTINGS)


async def test_publish_refuses_to_start_without_storage_configuration(monkeypatch, tmp_path):
    for key in config.storage_keys:
        monkeypatch.setattr(config, key, "")
    path = tmp_path / "indexes.csv"
    path.write_text("content")

    with pytest.raises(RuntimeError, match="S3_ENDPOINT"):
        await storage.publish(path, "indexes.csv")


def _xlsx_bytes() -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zf:
        zf.writestr("xl/workbook.xml", "<workbook/>")
    return buffer.getvalue()
