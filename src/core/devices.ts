import type { DeviceInfo, DeviceResult } from '../types'
import { listAndroidDevices } from '../android'
import { listIOSDevices } from '../ios'

export async function listAvailableDevices(): Promise<DeviceResult[]> {
  const [ios, android] = await Promise.all([
    listIOSDevices(),
    listAndroidDevices(),
  ])

  return [ios, android].filter(result => result.devices.length > 0)
}

export async function findPreferredDevice(): Promise<{ result: DeviceResult, device: DeviceInfo } | null> {
  const ios = await listIOSDevices()

  if (ios.devices[0])
    return { result: ios, device: ios.devices[0] }

  const android = await listAndroidDevices()

  if (android.devices[0])
    return { result: android, device: android.devices[0] }

  return null
}
