import type { DeviceInfo, DeviceResult, MemorySample, ProcessInfo, WatchResult, WatchSummary } from '../types'
import process from 'node:process'
import { findAndroidWechatProcess, listAndroidDevices, sampleAndroidMemory } from '../android'
import { sleep } from '../utils'
import { findPreferredDevice } from './devices'

export interface WatchTarget {
  result: DeviceResult
  device: DeviceInfo
  process: ProcessInfo
}

export interface RunWatchOptions {
  interval: number
  target: WatchTarget
  onSample?: (sample: MemorySample, count: number) => void
}

export async function resolveWatchTarget(): Promise<WatchTarget> {
  const preferred = await findPreferredDevice()

  if (!preferred)
    throw new Error('No iOS or Android device found.')

  if (preferred.result.platform === 'ios') {
    const android = await listAndroidDevices()
    const androidDevice = android.devices.find(device => device.status === 'available')

    if (androidDevice)
      return resolveAndroidWatchTarget(android, androidDevice)

    throw new Error('iOS watch is not available in this first version. Use an Android device for watch.')
  }

  return resolveAndroidWatchTarget(preferred.result, preferred.device)
}

export async function runWatch(options: RunWatchOptions): Promise<WatchResult> {
  const startedAt = Date.now()
  const samples: MemorySample[] = []
  let interrupted = false

  const handleInterrupt = () => {
    interrupted = true
  }

  process.once('SIGINT', handleInterrupt)

  try {
    while (true) {
      if (interrupted)
        break

      const sample = await sampleAndroidMemory(options.target.device, options.target.process)
      samples.push(sample)
      options.onSample?.(sample, samples.length)

      await waitForNextSample(options.interval, () => interrupted)
    }
  }
  finally {
    process.off('SIGINT', handleInterrupt)
  }

  const endedAt = Date.now()

  return {
    platform: options.target.result.platform,
    source: options.target.result.source,
    interval: options.interval,
    device: options.target.device,
    process: options.target.process,
    startedAt,
    endedAt,
    sampleCount: samples.length,
    summary: summarizeSamples(samples),
    samples,
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
