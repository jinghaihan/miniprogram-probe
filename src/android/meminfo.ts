import type { DeviceInfo, MemorySample, MemorySnapshot, ProcessInfo } from '../types'
import { kilobytesToBytes, runCommand } from '../utils'
import { resolveAdbCommand } from './adb'

const MEMINFO_LABELS = [
  'Native Heap',
  'Dalvik Heap',
  'Dalvik Other',
  'Stack',
  'Gfx dev',
  'EGL mtrack',
  'GL mtrack',
  '.so mmap',
  '.dex mmap',
  '.oat mmap',
  '.art mmap',
  'Other dev',
  'Other mmap',
  'Unknown',
  'TOTAL',
] as const

export async function sampleAndroidMemory(device: DeviceInfo, process: ProcessInfo): Promise<MemorySample> {
  const result = await runCommand(resolveAdbCommand(), ['-s', device.id, 'shell', 'dumpsys', 'meminfo', String(process.pid)])

  if (!result.ok)
    throw new Error(result.stderr || result.error || 'Failed to read Android memory.')

  return {
    timestamp: Date.now(),
    memory: parseAndroidMeminfo(result.stdout),
  }
}

export function parseAndroidMeminfo(stdout: string): MemorySnapshot {
  const rows = parseMeminfoRows(stdout)

  return {
    total: readRowBytes(rows, 'TOTAL'),
    native: readRowBytes(rows, 'Native Heap'),
    managed: sumRows(rows, ['Dalvik Heap', 'Dalvik Other']),
    graphics: sumRows(rows, ['Gfx dev', 'EGL mtrack', 'GL mtrack']),
    code: sumRows(rows, ['.so mmap', '.dex mmap', '.oat mmap', '.art mmap']),
    stack: readRowBytes(rows, 'Stack'),
    other: sumRows(rows, ['Other dev', 'Other mmap']),
    unknown: readRowBytes(rows, 'Unknown'),
  }
}

function parseMeminfoRows(stdout: string): Map<string, number> {
  const rows = new Map<string, number>()

  for (const line of stdout.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed)
      continue

    const totalPss = trimmed.match(/^TOTAL\s+PSS:\s+(\d+)/)

    if (totalPss) {
      rows.set('TOTAL', Number(totalPss[1]))
      continue
    }

    for (const label of MEMINFO_LABELS) {
      if (!trimmed.startsWith(label))
        continue

      const value = trimmed.slice(label.length).trim().match(/^(\d+)/)

      if (value)
        rows.set(label, Number(value[1]))
    }
  }

  return rows
}

function readRowBytes(rows: Map<string, number>, label: string): number | null {
  const value = rows.get(label)
  return typeof value === 'number' ? kilobytesToBytes(value) : null
}

function sumRows(rows: Map<string, number>, labels: string[]): number | null {
  const values = labels
    .map(label => rows.get(label))
    .filter((value): value is number => typeof value === 'number')

  if (!values.length)
    return null

  return kilobytesToBytes(values.reduce((sum, value) => sum + value, 0))
}
