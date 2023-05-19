import { describe, it, expect } from 'vitest'
import { mergeConfig, default_config } from '../../src/manager/config'

describe('config', () => {
  it('default', () => {
    expect(default_config).toEqual({
      host: 'localhost',
      port: 3306,
    })
    expect(mergeConfig()).toBe(default_config)
  })
})
