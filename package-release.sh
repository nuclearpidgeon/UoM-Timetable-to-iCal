#!/bin/bash

echo "Enter release number (e.g. 1.1.2):"
read RELEASE_NUMBER

cd extension/

zip ../releases/release-$RELEASE_NUMBER background.* contentscript.js icon* libs/* manifest.json popup.*
