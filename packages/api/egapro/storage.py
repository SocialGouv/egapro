import asyncio
import zipfile
from pathlib import Path

import boto3

from egapro import config
from egapro.config import StorageSettings


def object_key(name: str, settings: StorageSettings) -> str:
    return f"{settings.prefix}/{name}" if settings.prefix else name


def ensure_complete(path: Path) -> None:
    """An XLSX that is not a complete zip is a truncated save: publishing it would
    replace a valid export with an unreadable one."""
    if not path.exists() or path.stat().st_size == 0:
        raise ValueError(f"Refusing to publish an empty file: {path.name}")
    if path.suffix == ".xlsx" and not zipfile.is_zipfile(path):
        raise ValueError(f"Refusing to publish a truncated XLSX: {path.name}")


def client(settings: StorageSettings):
    return boto3.client(
        "s3",
        endpoint_url=settings.endpoint,
        region_name=settings.region,
        aws_access_key_id=settings.access_key_id,
        aws_secret_access_key=settings.secret_access_key,
    )


def upload(path: Path, name: str, settings: StorageSettings) -> None:
    ensure_complete(path)
    client(settings).upload_file(str(path), settings.bucket, object_key(name, settings))


def verify(path: Path, name: str, settings: StorageSettings) -> None:
    head = client(settings).head_object(Bucket=settings.bucket, Key=object_key(name, settings))
    expected = path.stat().st_size
    if head["ContentLength"] != expected:
        raise ValueError(
            f"Published size mismatch for {name}: {head['ContentLength']} bytes on the storage, "
            f"{expected} on disk"
        )


async def publish(path: Path, name: str, settings: StorageSettings = None) -> None:
    """Upload a complete file then check what the storage actually holds.

    The upload is streamed from disk (boto3 reads it by chunks), and S3 only makes
    an object visible once its transfer is complete: a failure leaves the previous
    export in place.
    """
    settings = settings or config.storage_settings()
    await asyncio.to_thread(upload, path, name, settings)
    await asyncio.to_thread(verify, path, name, settings)
