import type { Options } from './types'
import pkg from '../package.json'

export const NAME = pkg.name

export const VERSION = pkg.version

export const DEFAULT_OPTIONS: Partial<Options> = {}

export const RANGE_MODE = ['device', 'watch'] as const

export const DEFAULT_WATCH_INTERVAL_MS = 5000

export const DEFAULT_OUTPUT_DIR = 'outputs'

export const WATCH_OUTPUT_FILENAME_PREFIX = 'miniprogram-probe-watch'

export const COMMAND_TIMEOUT_MS = 8000

export const ADB_COMMAND = 'adb'

export const ADB_RELATIVE_PATH = 'platform-tools/adb'

export const WECHAT_ANDROID_PACKAGE = 'com.tencent.mm'

export const WECHAT_ANDROID_APPBRAND_PREFIX = 'com.tencent.mm:appbrand'

export const WECHAT_ANDROID_APPBRAND_UI = 'plugin.appbrand.ui.AppBrandUI'
