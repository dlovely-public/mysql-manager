import { mergeConfig, default_config } from '../src/config'

describe('config', () => {
  it('default', () => {
    expect(default_config).toEqual({
      host: 'localhost',
      port: 3306,
    })
    expect(mergeConfig()).toBe(default_config)
  })
})
