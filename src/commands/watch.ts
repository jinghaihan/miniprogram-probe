import type { WatchTarget } from '../core'
import type { CommandOptions, MemorySample, WatchResult } from '../types'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { DEFAULT_OUTPUT_DIR, DEFAULT_WATCH_INTERVAL_MS, WATCH_OUTPUT_FILENAME_PREFIX } from '../constants'
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
    const startedAt = Date.now()
    const outputPath = resolveWatchOutputPath(options.output, startedAt, options.cwd)

    spinner = p.spinner()
    p.note(c.green(outputPath), 'Output')
    spinner.start(`Watching ${c.cyan(target.process.name)}. Press ${c.yellow('Ctrl-C')} to stop.`)

    const result = await runWatch({
      interval,
      startedAt,
      target,
      async onSample(sample, count, currentResult) {
        await writeWatchResult(outputPath, currentResult)
        spinner?.message(`Collected ${c.cyan(String(count))} sample${count === 1 ? '' : 's'}. Press ${c.yellow('Ctrl-C')} to stop.`)
        p.note(formatSampleNote(target, sample, count, interval), `Sample ${c.cyan(String(count))}`)
      },
    })

    spinner.stop(`Stopped after ${c.cyan(String(result.sampleCount))} sample${result.sampleCount === 1 ? '' : 's'}.`)
    await writeWatchResult(outputPath, result)
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

export function resolveWatchOutputPath(output: string | undefined, timestamp: number, cwd = process.cwd()): string {
  if (output)
    return resolve(cwd, output)

  return resolve(cwd, DEFAULT_OUTPUT_DIR, `${WATCH_OUTPUT_FILENAME_PREFIX}-${formatOutputTimestamp(timestamp)}.json`)
}

function parseInterval(value: CommandOptions['interval']): number | null {
  if (value === undefined)
    return DEFAULT_WATCH_INTERVAL_MS

  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

async function writeWatchResult(outputPath: string, result: WatchResult): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

function formatOutputTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')
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
