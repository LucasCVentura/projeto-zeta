#!/bin/sh
set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

chmod +x .githooks/pre-commit .githooks/pre-push
git config core.hooksPath .githooks

echo "Hooks configurados em .githooks"
echo "pre-commit: validacoes de schema, prod DB e testes"
echo "pre-push: bloqueio de push direto na main"
