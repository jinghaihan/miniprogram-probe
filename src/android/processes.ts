import type { AndroidProcess, DeviceInfo, ProcessInfo } from '../types'
import { WECHAT_ANDROID_APPBRAND_PREFIX, WECHAT_ANDROID_APPBRAND_UI, WECHAT_ANDROID_PACKAGE } from '../constants'
import { runCommand } from '../utils'
import { resolveAdbCommand } from './adb'

export async function findAndroidWechatProcess(device: DeviceInfo): Promise<ProcessInfo | null> {
  const processes = await listAndroidProcesses(device)
  const activeAppbrand = await findActiveAndroidAppbrandProcess(device, processes)

  return selectAndroidWechatProcess(processes, activeAppbrand)
}

export function selectAndroidWechatProcess(
  processes: AndroidProcess[],
  activeAppbrand: AndroidProcess | null = null,
): ProcessInfo | null {
  if (activeAppbrand)
    return activeAppbrand

  const appbrandProcesses = processes.filter(isWechatAppbrandProcess)

  if (appbrandProcesses.length === 1)
    return appbrandProcesses[0]

  const wechat = processes.find(process => process.name === WECHAT_ANDROID_PACKAGE)

  if (wechat)
    return wechat

  return processes.find(process => process.name.startsWith(`${WECHAT_ANDROID_PACKAGE}:`) && !isWechatAppbrandProcess(process)) || null
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

export function parseAndroidAppbrandActivityProcess(stdout: string, processes: AndroidProcess[]): AndroidProcess | null {
  const lines = stdout.split('\n')
  const activityLineIndexes = lines
    .map((line, index) => line.includes(WECHAT_ANDROID_APPBRAND_UI) ? index : -1)
    .filter(index => index >= 0)

  for (const index of activityLineIndexes) {
    const process = findAppbrandProcessInLine(lines[index], processes)

    if (process)
      return process
  }

  for (const index of activityLineIndexes) {
    const context = lines.slice(index, index + 12)
    const process = findAppbrandProcessInLines(context, processes)

    if (process)
      return process
  }

  return null
}

async function listAndroidProcesses(device: DeviceInfo): Promise<AndroidProcess[]> {
  const adb = resolveAdbCommand()
  const result = await runCommand(adb, ['-s', device.id, 'shell', 'ps', '-A'])

  if (result.ok)
    return parseAndroidProcesses(result.stdout)

  const fallback = await runCommand(adb, ['-s', device.id, 'shell', 'ps'])

  return fallback.ok ? parseAndroidProcesses(fallback.stdout) : []
}

async function findActiveAndroidAppbrandProcess(
  device: DeviceInfo,
  processes: AndroidProcess[],
): Promise<AndroidProcess | null> {
  const adb = resolveAdbCommand()
  const dumpsysCommands = [
    ['-s', device.id, 'shell', 'dumpsys', 'activity', 'top'],
    ['-s', device.id, 'shell', 'dumpsys', 'activity', 'activities'],
  ]

  for (const args of dumpsysCommands) {
    const result = await runCommand(adb, args)

    if (!result.ok)
      continue

    const process = parseAndroidAppbrandActivityProcess(result.stdout, processes)

    if (process)
      return process
  }

  return null
}

function findAppbrandProcessInLines(lines: string[], processes: AndroidProcess[]): AndroidProcess | null {
  for (const line of lines) {
    const process = findAppbrandProcessInLine(line, processes)

    if (process)
      return process
  }

  return null
}

function findAppbrandProcessInLine(line: string, processes: AndroidProcess[]): AndroidProcess | null {
  const name = readAppbrandProcessName(line)
  const processByName = name ? processes.find(process => process.name === name) : null

  if (processByName)
    return processByName

  const pid = readProcessPid(line)

  if (pid === null)
    return null

  return processes.find(process => process.pid === pid && isWechatAppbrandProcess(process)) || null
}

function readAppbrandProcessName(line: string): string | null {
  return line.match(/\bcom\.tencent\.mm:appbrand[^\s/}]*/)?.[0] || null
}

function readProcessPid(line: string): number | null {
  const pid = line.match(/\bpid=(\d+)\b/)?.[1] || line.match(/\b(\d+):com\.tencent\.mm:appbrand[^\s/}]*/)?.[1]

  if (!pid)
    return null

  const parsed = Number(pid)

  return Number.isFinite(parsed) ? parsed : null
}

function isWechatAppbrandProcess(process: AndroidProcess): boolean {
  return process.name.startsWith(WECHAT_ANDROID_APPBRAND_PREFIX)
}
