#!/bin/sh
set -e
V="${1:-1.0.0}"
npx esbuild src/party-builder.js --bundle --format=iife --target=es2019 --loader:.css=text --define:__LGIJ_VERSION__="\"$V\"" --legal-comments=inline --outfile=dist/lgij-party-builder.js --log-level=warning
npx esbuild src/party-builder.js --bundle --format=iife --target=es2019 --loader:.css=text --define:__LGIJ_VERSION__="\"$V\"" --minify --legal-comments=inline --outfile=dist/lgij-party-builder.min.js --log-level=warning
ls -la dist
sha256sum dist/*.js
gzip -c dist/lgij-party-builder.min.js | wc -c
