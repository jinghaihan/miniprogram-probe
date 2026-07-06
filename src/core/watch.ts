import type { DeviceInfo, DeviceResult, MemorySample, ProcessInfo, WatchResult, WatchSummary } from '../types'
import process from 'node:process'
import { findAndroidWechatProcess, listAndroidDevices, sampleAndroidMemory } from '../android'
import { sleep } from '../utils'

export interface WatchTarget {
  result: DeviceResult
  device: DeviceInfo
  process: ProcessInfo
}

export interface RunWatchOptions {
  interval: number
  target: WatchTarget
  startedAt?: number
  onSample?: (sample: MemorySample, count: number, result: WatchResult) => void | Promise<void>
  sampleMemory?: (device: DeviceInfo, process: ProcessInfo) => Promise<MemorySample>
  signal?: AbortSignal
}

export async function resolveWatchTarget(): Promise<WatchTarget> {
  const android = await listAndroidDevices()
  const androidDevice = findAvailableAndroidDevice(android)

  if (!androidDevice)
    throw new Error(formatAndroidWatchDeviceError(android))

  return resolveAndroidWatchTarget(android, androidDevice)
}

export async function runWatch(options: RunWatchOptions): Promise<WatchResult> {
  const startedAt = options.startedAt || Date.now()
  const samples: MemorySample[] = []
  const sampleMemory = options.sampleMemory || sampleAndroidMemory
  let interrupted = options.signal?.aborted || false

  const handleInterrupt = () => {
    interrupted = true
  }

  options.signal?.addEventListener('abort', handleInterrupt)
  process.once('SIGINT', handleInterrupt)

  try {
    while (true) {
      if (interrupted)
        break

      let sample: MemorySample

      try {
        sample = await sampleMemory(options.target.device, options.target.process)
      }
      catch (error) {
        if (interrupted)
          break

        throw error
      }

      samples.push(sample)
      await options.onSample?.(
        sample,
        samples.length,
        createWatchResult(options.target, options.interval, startedAt, Date.now(), samples),
      )

      await waitForNextSample(options.interval, () => interrupted)
    }
  }
  finally {
    options.signal?.removeEventListener('abort', handleInterrupt)
    process.off('SIGINT', handleInterrupt)
  }

  const endedAt = Date.now()

  return createWatchResult(options.target, options.interval, startedAt, endedAt, samples)
}

function createWatchResult(
  target: WatchTarget,
  interval: number,
  startedAt: number,
  endedAt: number,
  samples: MemorySample[],
): WatchResult {
  return {
    platform: target.result.platform,
    source: target.result.source,
    interval,
    device: target.device,
    process: target.process,
    startedAt,
    endedAt,
    sampleCount: samples.length,
    summary: summarizeSamples(samples),
    samples: [...samples],
  }
}

export function summarizeSamples(samples: MemorySample[]): WatchSummary {
  const totals = samples
    .map(sample => sample.memory.total)
    .filter((value): value is number => typeof value === 'number')

  if (!totals.length) {
    return {
      peakTotal: null,
      minTotal: null,
      lastTotal: null,
    }
  }

  return {
    peakTotal: Math.max(...totals),
    minTotal: Math.min(...totals),
    lastTotal: totals.at(-1) || null,
  }
}

export function findAvailableAndroidDevice(result: DeviceResult): DeviceInfo | null {
  return result.devices.find(device => device.status === 'available') || null
}

export function formatAndroidWatchDeviceError(result: DeviceResult): string {
  if (!result.devices.length)
    return 'No Android device found. Watch currently requires an available Android device.'

  const devices = result.devices
    .map(device => `${formatDeviceLabel(device)} is ${device.status}`)
    .join('\n')

  if (result.devices.some(device => device.status === 'unauthorized')) {
    return [
      'Android device is unauthorized.',
      devices,
      'Unlock the device, confirm the USB debugging prompt, then run adb devices until it shows "device".',
    ].join('\n')
  }

  return [
    'No available Android device found.',
    devices,
    'Reconnect the device or check adb devices before running watch again.',
  ].join('\n')
}

function formatDeviceLabel(device: DeviceInfo): string {
  return device.name === device.id ? device.id : `${device.name} (${device.id})`
}

async function resolveAndroidWatchTarget(result: DeviceResult, device: DeviceInfo): Promise<WatchTarget> {
  const targetProcess = await findAndroidWechatProcess(device)

  if (!targetProcess)
    throw new Error('No WeChat or WeChat Mini Program process found on the Android device.')

  return {
    result,
    device,
    process: targetProcess,
  }
}

async function waitForNextSample(interval: number, isInterrupted: () => boolean): Promise<void> {
  const step = 100
  let remaining = interval

  while (remaining > 0 && !isInterrupted()) {
    const current = Math.min(step, remaining)
    await sleep(current)
    remaining -= current
  }
}
