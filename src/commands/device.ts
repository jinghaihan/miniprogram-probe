import type { DeviceInfo, DeviceResult } from '../types'
import * as p from '@clack/prompts'
import c from 'ansis'
import { listAvailableDevices } from '../core'

export async function runDeviceCommand(): Promise<number> {
  const results = await listAvailableDevices()

  if (!results.length) {
    p.note(c.red('No available iOS or Android device found.'), 'Device')
    p.outro(c.red('No device found.'))
    return 1
  }

  for (const result of results)
    p.note(formatDeviceResult(result), `${c.cyan(result.platform)} devices`)

  p.outro(c.green('Device check finished.'))

  return 0
}

function formatDeviceResult(result: DeviceResult): string {
  return result.devices
    .map(device => [
      `${c.dim('Name:')} ${c.bold(device.name)}`,
      `${c.dim('ID:')} ${c.cyan(device.id)}`,
      `${c.dim('Platform:')} ${c.cyan(device.platform)}`,
      `${c.dim('Source:')} ${c.magenta(result.source)}`,
      `${c.dim('Status:')} ${formatDeviceStatus(device.status)}`,
    ].join('\n'))
    .join('\n\n')
}

function formatDeviceStatus(status: DeviceInfo['status']): string {
  switch (status) {
    case 'available':
      return c.green(status)
    case 'unauthorized':
      return c.red(status)
    default:
      return c.yellow(status)
  }
}
