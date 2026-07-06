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
  const iosDevice = ios.devices.find(device => device.status === 'available')

  if (iosDevice)
    return { result: ios, device: iosDevice }

  const android = await listAndroidDevices()
  const androidDevice = android.devices.find(device => device.status === 'available')

  if (androidDevice)
    return { result: android, device: androidDevice }

  return null
}
