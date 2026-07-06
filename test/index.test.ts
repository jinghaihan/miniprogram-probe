import { describe, expect, it } from 'vitest'
import { parseAndroidAppbrandActivityProcess, parseAndroidProcesses, selectAndroidWechatProcess } from '../src/android/processes'

describe('android processes', () => {
  const processes = [
    { pid: 100, name: 'com.tencent.mm' },
    { pid: 201, name: 'com.tencent.mm:appbrand0' },
    { pid: 202, name: 'com.tencent.mm:appbrand2' },
    { pid: 203, name: 'com.tencent.mm:appbrand4' },
  ]

  it('parses Android ps output', () => {
    expect(parseAndroidProcesses(`
USER PID PPID VSZ RSS WCHAN ADDR S NAME
u0_a123 100 1 1 1 0 0 S com.tencent.mm
u0_a123 202 1 1 1 0 0 S com.tencent.mm:appbrand2
`)).toEqual([
      { pid: 100, name: 'com.tencent.mm' },
      { pid: 202, name: 'com.tencent.mm:appbrand2' },
    ])
  })

  it('resolves the active AppBrand process by activity pid', () => {
    const output = `
TASK com.tencent.mm id=12
  ACTIVITY com.tencent.mm/.plugin.appbrand.ui.AppBrandUI 7cb1 pid=202
`

    expect(parseAndroidAppbrandActivityProcess(output, processes)).toEqual({
      pid: 202,
      name: 'com.tencent.mm:appbrand2',
    })
  })

  it('resolves the active AppBrand process by activity ProcessRecord', () => {
    const output = `
ActivityRecord{8ab u0 com.tencent.mm/.plugin.appbrand.ui.AppBrandUI t42}
  app=ProcessRecord{71f 203:com.tencent.mm:appbrand4/u0a123}
`

    expect(parseAndroidAppbrandActivityProcess(output, processes)).toEqual({
      pid: 203,
      name: 'com.tencent.mm:appbrand4',
    })
  })

  it('does not pick appbrand0 when multiple AppBrand processes are ambiguous', () => {
    expect(selectAndroidWechatProcess(processes)).toEqual({
      pid: 100,
      name: 'com.tencent.mm',
    })
  })
})
