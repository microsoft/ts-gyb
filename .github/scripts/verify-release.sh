#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_TAG:?RELEASE_TAG must be set}"
: "${RELEASE_SHA:?RELEASE_SHA must be set}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT must be set}"

if ! tag_sha=$(git rev-parse --verify "refs/tags/${RELEASE_TAG}^{commit}"); then
  echo "::error::Release tag must resolve to a commit."
  exit 1
fi

if [ "$tag_sha" != "$RELEASE_SHA" ]; then
  echo "::error::Release tag no longer matches the release event commit."
  exit 1
fi

if ! git merge-base --is-ancestor "$tag_sha" refs/remotes/origin/main; then
  echo "::error::Release commit must be in origin/main history."
  exit 1
fi

printf 'sha=%s\n' "$tag_sha" >> "$GITHUB_OUTPUT"
