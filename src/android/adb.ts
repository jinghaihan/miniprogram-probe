import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import process from 'node:process'
import { join } from 'pathe'
import { ADB_COMMAND, ADB_RELATIVE_PATH } from '../constants'

export function resolveAdbCommand(): string {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    join(homedir(), 'Library/Android/sdk'),
  ]
    .filter((path): path is string => Boolean(path))
    .map(path => join(path, ADB_RELATIVE_PATH))

  return candidates.find(candidate => existsSync(candidate)) || ADB_COMMAND
}
