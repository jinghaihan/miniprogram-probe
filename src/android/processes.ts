import type { AndroidProcess, DeviceInfo, ProcessInfo } from '../types'
import { WECHAT_ANDROID_APPBRAND_PREFIX, WECHAT_ANDROID_PACKAGE } from '../constants'
import { runCommand } from '../utils'
import { resolveAdbCommand } from './adb'

export async function findAndroidWechatProcess(device: DeviceInfo): Promise<ProcessInfo | null> {
  const processes = await listAndroidProcesses(device)
  const appbrand = processes.find(process => process.name.startsWith(WECHAT_ANDROID_APPBRAND_PREFIX))

  if (appbrand)
    return appbrand

  const wechat = processes.find(process => process.name === WECHAT_ANDROID_PACKAGE)

  if (wechat)
    return wechat

  return processes.find(process => process.name.startsWith(WECHAT_ANDROID_PACKAGE)) || null
}

export function parseAndroidProcesses(stdout: string): AndroidProcess[] {
  const lines = stdout.split('\n').map(line => line.trim()).filter(Boolean)
  const header = lines.find(line => /\bPID\b/.test(line))
  const headerParts = header?.split(/\s+/) || []
  const pidIndex = headerParts.indexOf('PID')
  const nameIndex = headerParts.findIndex(part => part === 'NAME' || part === 'CMDLINE')

  return lines
    .filter(line => line !== header)
    .map((line) => {
      const parts = line.split(/\s+/)
      const pid = Number(parts[pidIndex >= 0 ? pidIndex : 1])
      const name = nameIndex >= 0 ? parts.slice(nameIndex).join(' ') : parts.at(-1) || ''

      return Number.isFinite(pid) && name
        ? { pid, name }
        : null
    })
    .filter((process): process is AndroidProcess => process !== null)
}

async function listAndroidProcesses(device: DeviceInfo): Promise<AndroidProcess[]> {
  const adb = resolveAdbCommand()
  const result = await runCommand(adb, ['-s', device.id, 'shell', 'ps', '-A'])

  if (result.ok)
    return parseAndroidProcesses(result.stdout)

  const fallback = await runCommand(adb, ['-s', device.id, 'shell', 'ps'])

  return fallback.ok ? parseAndroidProcesses(fallback.stdout) : []
}
