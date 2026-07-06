import type { DeviceInfo, DeviceResult } from '../types'
import { runCommand } from '../utils'
import { resolveAdbCommand } from './adb'

export async function listAndroidDevices(): Promise<DeviceResult> {
  const result = await runCommand(resolveAdbCommand(), ['devices'])

  return {
    platform: 'android',
    source: 'adb',
    devices: result.ok ? parseAdbDevices(result.stdout) : [],
  }
}

export function parseAdbDevices(stdout: string): DeviceInfo[] {
  return stdout
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('List of devices'))
    .map((line) => {
      const [id, state] = line.split(/\s+/)

      return {
        id,
        name: id,
        platform: 'android' as const,
        status: parseAdbDeviceStatus(state),
      }
    })
}

function parseAdbDeviceStatus(state: string | undefined): DeviceInfo['status'] {
  switch (state) {
    case 'device':
      return 'available'
    case 'unauthorized':
      return 'unauthorized'
    case 'offline':
      return 'unavailable'
    default:
      return 'unknown'
  }
}
