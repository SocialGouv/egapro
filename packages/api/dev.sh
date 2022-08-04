#!/bin/bash

watchmedo auto-restart \
 --patterns="*.py" \
 --recursive \
 ./start.sh