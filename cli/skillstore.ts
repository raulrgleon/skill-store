import {
  INSTALL_TARGETS,
  installSkill,
  listCatalog,
  listInstalled,
  parseTargets,
  targetHomes,
  uninstallSkill,
} from '../server/installer.ts'

function printHelp() {
  console.log(`Skill Store CLI

  npm run skillstore -- install <id> --target cursor,claude
  npm run skillstore -- uninstall <id>
  npm run skillstore -- list
  npm run skillstore -- catalog
`)
}

function arg(flag: string) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function main() {
  const command = process.argv[2]

  if (!command || command === 'help' || command === '-h') {
    printHelp()
    return
  }

  if (command === 'catalog') {
    for (const id of await listCatalog()) console.log(id)
    return
  }

  if (command === 'list') {
    const { installed } = await listInstalled()
    const ids = Object.keys(installed)
    if (ids.length === 0) {
      console.log('No hay skills instaladas por Skill Store.')
      return
    }
    for (const id of ids) {
      console.log(`${id}  →  ${installed[id].join(', ')}`)
    }
    return
  }

  if (command === 'targets') {
    for (const target of INSTALL_TARGETS) {
      console.log(`${target}: ${targetHomes[target]}`)
    }
    return
  }

  const id = process.argv[3]
  if (!id) {
    printHelp()
    process.exitCode = 1
    return
  }

  const rawTargets = arg('--target') ?? arg('-t') ?? INSTALL_TARGETS.join(',')

  if (command === 'install') {
    const result = await installSkill(id, parseTargets(rawTargets))
    console.log(`Instalada ${result.id}`)
    for (const [target, path] of Object.entries(result.paths)) {
      console.log(`  ${target}: ${path}`)
    }
    return
  }

  if (command === 'uninstall') {
    const result = await uninstallSkill(id, parseTargets(rawTargets))
    const removed = Object.keys(result.removed)
    if (removed.length === 0) {
      console.log(`No había una instalación de ${id} hecha por Skill Store.`)
      return
    }
    console.log(`Quitada ${result.id} de ${removed.join(', ')}`)
    return
  }

  printHelp()
  process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
