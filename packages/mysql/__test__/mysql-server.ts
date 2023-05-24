import { vi, afterAll, beforeAll } from 'vitest'
import { SqlWithParams, formatSql } from '@dlovely/sql-editor'
import { Mysql } from '../src/mysql'

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
