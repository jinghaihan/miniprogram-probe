# miniprogram-probe

[![npm version][npm-version-src]][npm-version-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

## Usage

`miniprogram-probe` samples WeChat Mini Program memory on a real Android device.

### Requirements

- Node.js and pnpm
- Android device with WeChat installed
- ADB

Install ADB:

- Recommended: install [Android Studio](https://developer.android.com/studio), then install Android SDK Platform-Tools from SDK Manager.
- Or download [SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) directly.

On macOS, ADB is usually installed at:

```bash
~/Library/Android/sdk/platform-tools/adb
```

If `adb` is not found, add it to `PATH`:

```bash
echo 'export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Enable USB debugging on the phone, connect it to the computer, then check:

```bash
adb devices
```

The device status should be `device`, not `unauthorized` or `offline`.

### Usage

Install dependencies:

```bash
pnpm install
```

List devices:

```bash
pnpm start device
```

Open the target Mini Program and keep it in the foreground, then start sampling:

```bash
pnpm start watch
```

Set a custom interval and output file:

```bash
pnpm start watch --interval 1000 --output outputs/watch.json
```

Press `Ctrl-C` to stop. The CLI keeps writing JSON while sampling and prints the final result when stopped.

### Process Selection

WeChat may keep several Mini Program processes alive:

```text
com.tencent.mm:appbrand0
com.tencent.mm:appbrand1
com.tencent.mm:appbrand2
```

The CLI does not guess from `appbrand0/1/2`. It reads Android Activity state, finds the pid for the current `AppBrandUI`, then samples that pid with `dumpsys meminfo`.

To avoid sampling a background leftover process, open the target Mini Program in the foreground before running `watch`. To verify manually:

```bash
adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'
adb shell dumpsys activity top | grep -A40 'ACTIVITY com.tencent.mm/.plugin.appbrand.ui.AppBrandUI'
adb shell ps -A | grep 'com.tencent.mm:appbrand'
```

## Configuration

No config file is required.

Options:

- `--interval <ms>`: sample interval. Default: `5000`.
- `--output <file>`: JSON output path. Default: `outputs/miniprogram-probe-watch-<timestamp>.json`.

## Development

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

## License

[MIT](./LICENSE) License © [jinghaihan](https://github.com/jinghaihan)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/miniprogram-probe?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/miniprogram-probe
[npm-downloads-src]: https://img.shields.io/npm/dm/miniprogram-probe?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/miniprogram-probe
[bundle-src]: https://img.shields.io/bundlephobia/minzip/miniprogram-probe?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=miniprogram-probe
[license-src]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/jinghaihan/miniprogram-probe/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/miniprogram-probe
