import type { ConfigOptions } from './types'

export * from './types'

export function defineConfig(config: Partial<ConfigOptions>) {
  return config
}
