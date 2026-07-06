import type { CommandResult } from './types'
import { x } from 'tinyexec'
import { COMMAND_TIMEOUT_MS } from './constants'

export async function runCommand(command: string, args: string[] = []): Promise<CommandResult> {
  try {
    const result = await x(command, args, {
      timeout: COMMAND_TIMEOUT_MS,
      throwOnError: false,
    })

    return {
      ok: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode ?? null,
    }
  }
  catch (error) {
    const execError = error as Error

    return {
      ok: false,
      stdout: '',
      stderr: '',
      exitCode: null,
      error: execError.message,
    }
  }
}

export function kilobytesToBytes(value: number): number {
  return value * 1024
}

export function formatBytes(value: number | null): string {
  if (value === null)
    return '-'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
