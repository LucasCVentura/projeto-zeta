#!/usr/bin/env node
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"))
const version = pkg.version

const changelogSrc = readFileSync(resolve(root, "src/lib/changelog.ts"), "utf8")

if (!changelogSrc.includes(`version: "${version}"`)) {
  console.error(`\n❌  Versão ${version} não tem entrada no changelog!`)
  console.error(`   Adicione uma entrada em src/lib/changelog.ts antes de commitar.\n`)
  process.exit(1)
}

console.log(`✓ Changelog contém entrada para v${version}`)
