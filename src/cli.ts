import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { runDeviceCommand } from './commands/device'
import { runWatchCommand } from './commands/watch'
import { DEFAULT_WATCH_INTERVAL_MS, NAME, RANGE_MODE, VERSION } from './constants'

try {
  const cli: CAC = cac(NAME)

  cli
    .command('[mode]', '')
    .option('--interval <ms>', 'Sample interval in milliseconds', {
      default: String(DEFAULT_WATCH_INTERVAL_MS),
    })
    .option('--output <file>', 'Write watch result JSON to a file')
    .action(async (mode: string | undefined, options: Partial<CommandOptions>) => {
      p.intro(`${c.yellow`${NAME} `}${c.dim`v${VERSION}`}`)

      switch (mode) {
        case 'device':
          process.exitCode = await runDeviceCommand()
          return

        case 'watch':
          process.exitCode = await runWatchCommand(options)
          return

        default:
          p.note(`Supported modes: ${RANGE_MODE.join(', ')}`, 'Mode')
          p.outro('Command failed.')
          process.exitCode = 1
      }
    })

  cli.help()
  cli.version(VERSION)
  cli.parse()
}
catch (error) {
  console.error(error)
  process.exit(1)
}
