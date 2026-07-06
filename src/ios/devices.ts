import type { DeviceInfo, DeviceResult } from '../types'
import { runCommand } from '../utils'

export async function listIOSDevices(): Promise<DeviceResult> {
  const result = await runCommand('xcrun', ['xctrace', 'list', 'devices'])

  return {
    platform: 'ios',
    source: 'xctrace',
    devices: result.ok ? parseXctraceDevices(result.stdout) : [],
  }
}

export function parseXctraceDevices(stdout: string): DeviceInfo[] {
  const devices: DeviceInfo[] = []
  let insideDevices = false

  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.trim()

    if (!line)
      continue

    if (line.startsWith('==')) {
      insideDevices = /^==\s*Devices\s*==$/i.test(line)
      continue
    }

    if (!insideDevices)
      continue

    const match = line.match(/\(([^()]+)\)\s*$/)

    if (!match || typeof match.index !== 'number')
      continue

    const id = match[1]
    const rawName = line.slice(0, match.index).trim()
    const name = rawName.replace(/\s+\([^()]+\)\s*$/, '')

    if (!/iphone|ipad|ipod|vision/i.test(`${name} ${line}`))
      continue

    devices.push({
      id,
      name,
      platform: 'ios',
      status: /unavailable/i.test(line) ? 'unavailable' : 'available',
    })
  }

  return devices.filter(device => device.status === 'available')
}
