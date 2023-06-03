import { describe, it, expect } from 'vitest'
import { genConfig } from '../src/config'

describe('config', () => {
  it('default', () => {
    const config = genConfig()
    expect(config).toEqual({
      type: 'pool',
      config: {
        host: 'localhost',
        port: 3306,
        user: 'localhost',
        password: undefined,
      },
    })
  })
})
