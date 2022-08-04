#!/bin/bash
set -e

[ ! -d /app/egapro.egg-info ] && ln -s /tmp/egapro.egg-info /app/egapro.egg-info

./init.py

exec $@