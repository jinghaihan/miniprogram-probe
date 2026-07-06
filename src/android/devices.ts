import type { DeviceInfo, DeviceResult } from '../types'
import { runCommand } from '../utils'

export async function listAndroidDevices(): Promise<DeviceResult> {
  const result = await runCommand('adb', ['devices'])

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
        status: state === 'device' ? 'available' as const : 'unavailable' as const,
      }
    })
    .filter(device => device.status === 'available')
}
