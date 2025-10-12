#!/usr/bin/env bash
set -euo pipefail

# Reusable deploy script for S3 static hosting
# Requirements:
# - AWS CLI v2 configured (aws configure)
# - Bucket exists and is configured for static hosting or public read (your choice)
#
# Usage:
#   scripts/deploy-s3.sh <S3_BUCKET_NAME> [--region <AWS_REGION>] [--no-cache]
#
# Notes:
# - Builds the app with static export to ./out
# - Syncs ./out to s3://$BUCKET
# - Sets proper content types and cache headers

BUCKET="${1:-}"
if [[ -z "$BUCKET" ]]; then
  echo "Usage: $0 <S3_BUCKET_NAME> [--region <AWS_REGION>] [--no-cache]" >&2
  exit 1
fi

REGION=""
NO_CACHE=false

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2";
      shift 2 ;;
    --no-cache)
      NO_CACHE=true;
      shift ;;
    *)
      echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

echo "Building static export..."
pnpm build

if [[ ! -d out ]]; then
  echo "Build output folder ./out not found" >&2
  exit 1
fi

DEST="s3://$BUCKET"

echo "Syncing files to $DEST ..."
EXTRA_ARGS=()
if [[ -n "$REGION" ]]; then
  EXTRA_ARGS+=("--region" "$REGION")
fi

# Default cache headers: index.html no-cache, assets long cache unless --no-cache
if $NO_CACHE; then
  # No-cache all
  aws s3 sync out "$DEST" --delete "${EXTRA_ARGS[@]}" \
    --cache-control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" \
    --exclude "*" --include "*"
else
  # Cache-bust strategy: html no-cache, others cache long
  aws s3 sync out "$DEST" --delete "${EXTRA_ARGS[@]}" \
    --exclude "*" --include "*.html" \
    --cache-control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"

  aws s3 sync out "$DEST" "${EXTRA_ARGS[@]}" \
    --exclude "*.html" \
    --cache-control "public, max-age=31536000, immutable"
fi

echo "Deployed to $DEST"
 
