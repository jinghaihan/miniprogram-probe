export interface CommandOptions {
  cwd?: string
  interval?: number | string
}

export interface ConfigOptions extends CommandOptions {}

export interface Options extends CommandOptions, ConfigOptions {}

export type DevicePlatform = 'ios' | 'android'

export type DeviceSource = 'xctrace' | 'adb'

export type DeviceStatus = 'available' | 'unavailable' | 'unknown'

export interface DeviceInfo {
  id: string
  name: string
  platform: DevicePlatform
  status: DeviceStatus
}

export interface DeviceResult {
  platform: DevicePlatform
  source: DeviceSource
  devices: DeviceInfo[]
}

export interface ProcessInfo {
  pid: number
  name: string
}

export interface MemorySnapshot {
  total: number | null
  native: number | null
  managed: number | null
  graphics: number | null
  code: number | null
  stack: number | null
  other: number | null
  unknown: number | null
}

export interface MemorySample {
  timestamp: number
  memory: MemorySnapshot
}

export interface WatchSummary {
  peakTotal: number | null
  minTotal: number | null
  lastTotal: number | null
}

export interface WatchResult {
  platform: DevicePlatform
  source: DeviceSource
  interval: number
  device: DeviceInfo
  process: ProcessInfo
  startedAt: number
  endedAt: number
  sampleCount: number
  summary: WatchSummary
  samples: MemorySample[]
}

export interface AndroidProcess {
  pid: number
  name: string
}

export interface CommandResult {
  ok: boolean
  stdout: string
  stderr: string
  exitCode: number | null
  error?: string
}
