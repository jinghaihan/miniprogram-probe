import type { WatchTarget } from '../core'
import type { CommandOptions, MemorySample } from '../types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { DEFAULT_WATCH_INTERVAL_MS } from '../constants'
import { resolveWatchTarget, runWatch } from '../core'
import { formatBytes } from '../utils'

export async function runWatchCommand(options: Partial<CommandOptions>): Promise<number> {
  const interval = parseInterval(options.interval)

  if (interval === null) {
    p.note(c.yellow('Interval must be a positive number of milliseconds.'), 'Watch')
    p.outro(c.red('Watch failed.'))
    return 1
  }

  let spinner: ReturnType<typeof p.spinner> | null = null

  try {
    const target = await resolveWatchTarget()

    spinner = p.spinner()
    spinner.start(`Watching ${c.cyan(target.process.name)}. Press ${c.yellow('Ctrl-C')} to stop.`)

    const result = await runWatch({
      interval,
      target,
      onSample(sample, count) {
        spinner?.message(`Collected ${c.cyan(String(count))} sample${count === 1 ? '' : 's'}. Press ${c.yellow('Ctrl-C')} to stop.`)
        p.note(formatSampleNote(target, sample, count, interval), `Sample ${c.cyan(String(count))}`)
      },
    })

    spinner.stop(`Stopped after ${c.cyan(String(result.sampleCount))} sample${result.sampleCount === 1 ? '' : 's'}.`)
    p.outro(c.green('Watch finished.'))
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

    return 0
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (spinner)
      spinner.error(message)
    else
      p.note(c.red(message), 'Watch')

    p.outro(c.red('Watch failed.'))

    return 1
  }
}

function parseInterval(value: CommandOptions['interval']): number | null {
  if (value === undefined)
    return DEFAULT_WATCH_INTERVAL_MS

  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function formatSampleNote(target: WatchTarget, sample: MemorySample, count: number, interval: number): string {
  return [
    `${c.dim('Platform:')} ${c.cyan(target.result.platform)}`,
    `${c.dim('Device:')} ${c.bold(target.device.name)} ${c.dim(`(${target.device.id})`)}`,
    `${c.dim('Process:')} ${c.cyan(target.process.name)} ${c.dim(`(${target.process.pid})`)}`,
    `${c.dim('Interval:')} ${c.yellow(`${interval}ms`)}`,
    `${c.dim('Samples:')} ${c.cyan(String(count))}`,
    `${c.dim('Total:')} ${c.yellow(formatBytes(sample.memory.total))}`,
    `${c.dim('Native:')} ${c.magenta(formatBytes(sample.memory.native))}`,
    `${c.dim('Managed:')} ${c.blue(formatBytes(sample.memory.managed))}`,
    `${c.dim('Graphics:')} ${c.cyan(formatBytes(sample.memory.graphics))}`,
    `${c.dim('Code:')} ${formatBytes(sample.memory.code)}`,
    `${c.dim('Stack:')} ${formatBytes(sample.memory.stack)}`,
    `${c.dim('Other:')} ${formatBytes(sample.memory.other)}`,
    `${c.dim('Unknown:')} ${c.dim(formatBytes(sample.memory.unknown))}`,
  ].join('\n')
}
