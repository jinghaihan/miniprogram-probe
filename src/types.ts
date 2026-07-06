export interface CommandOptions {
  cwd?: string
}

export interface ConfigOptions extends CommandOptions {}

export interface Options extends CommandOptions, ConfigOptions {}
