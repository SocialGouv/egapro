#!/usr/bin/env python3
import asyncio
from egapro.bin import migrate_from_legacy

asyncio.run(migrate_from_legacy())