import { vi, afterAll, beforeAll } from 'vitest'
import { SqlWithParams, formatSql } from '../../src/shared'
import { Mysql } from '../../src/manager/mysql'

export const execute = vi.fn((options: Partial<SqlWithParams>) =>
  formatSql(options)
)

beforeAll(() => {
  // @ts-ignore
  Mysql.prototype.execute = execute
  execute.mockClear()
})

afterAll(() => {
  // console.log('afterAll')
})
