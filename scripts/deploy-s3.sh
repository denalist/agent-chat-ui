#!/usr/bin/env bash
set -euo pipefail

# Reusable deploy script for S3 static hosting with optional runtime env upload
# Requirements:
# - AWS CLI v2 configured (aws configure)
# - Bucket exists and is configured for static hosting or public read (your choice)
#
# Usage:
#   scripts/deploy-s3.sh <S3_BUCKET_NAME> [--region <AWS_REGION>] [--no-cache] [--env-key <S3_KEY>]
#
# Notes:
# - Builds the app with static export to ./out
# - Syncs ./out to s3://$BUCKET
# - Uploads a sanitized .env file (NEXT_PUBLIC_* only) to S3 when present
# - Sets proper content types and cache headers

cleanup() {
  if [[ -n "${SANITIZED_ENV_TMP:-}" && -f "${SANITIZED_ENV_TMP}" ]]; then
    rm -f "${SANITIZED_ENV_TMP}"
  fi
}
SANITIZED_ENV_TMP=""
trap cleanup EXIT

BUCKET="${1:-}"
if [[ -z "$BUCKET" ]]; then
  echo "Usage: $0 <S3_BUCKET_NAME> [--region <AWS_REGION>] [--no-cache] [--env-key <S3_KEY>]" >&2
  exit 1
fi

REGION=""
NO_CACHE=false
ENV_OBJECT_KEY=".env"

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"
      shift 2
      ;;
    --no-cache)
      NO_CACHE=true
      shift
      ;;
    --env-key)
      ENV_OBJECT_KEY="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

ENV_FILE=""
for candidate in ".env.production" ".env.local" ".env"; do
  if [[ -z "$ENV_FILE" && -f "$candidate" ]]; then
    ENV_FILE="$candidate"
  fi
done

if [[ -n "$ENV_FILE" ]]; then
  echo "Loading environment variables from $ENV_FILE"
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
else
  echo "No .env file found. Proceeding without loading environment overrides."
fi

echo "Building static export..."
NEXT_BUILD_TARGET=static pnpm build

if [[ ! -d out ]]; then
  echo "Build output folder ./out not found" >&2
  exit 1
fi

DEST="s3://$BUCKET"
AWS_BASE=("aws")
if [[ -n "$REGION" ]]; then
  AWS_BASE+=("--region" "$REGION")
fi

echo "Syncing files to $DEST ..."
if $NO_CACHE; then
  "${AWS_BASE[@]}" s3 sync out "$DEST" --delete \
    --cache-control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" \
    --exclude "*" --include "*"
else
  "${AWS_BASE[@]}" s3 sync out "$DEST" --delete \
    --exclude "*" --include "*.html" \
    --cache-control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"

  "${AWS_BASE[@]}" s3 sync out "$DEST" \
    --exclude "*.html" \
    --cache-control "public, max-age=31536000, immutable"
fi

if [[ -n "$ENV_FILE" && -n "$ENV_OBJECT_KEY" ]]; then
  SANITIZED_ENV_TMP=$(mktemp)
  cp "$ENV_FILE" "$SANITIZED_ENV_TMP"

  if [[ -s "$SANITIZED_ENV_TMP" ]]; then
    ENV_KEY_TRIMMED="${ENV_OBJECT_KEY#/}"
    ENV_DEST="$DEST/$ENV_KEY_TRIMMED"
    echo "Uploading full env file (includes secret values) to $ENV_DEST"
    "${AWS_BASE[@]}" s3 cp "$SANITIZED_ENV_TMP" "$ENV_DEST" \
      --cache-control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" \
      --content-type "text/plain; charset=utf-8"
  else
    echo "Environment file was empty; skipping env upload."
  fi
else
  echo "No environment file detected; skipping env upload."
fi

echo "Deployed to $DEST"
