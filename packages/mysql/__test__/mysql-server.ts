import { vi, afterAll, beforeAll } from 'vitest'
import { SqlWithParams, formatSql } from '@dlovely/sql-editor'
import { MysqlServer } from '../src/mysql'

export const execute = vi.fn((options: Partial<SqlWithParams>) =>
  Promise.resolve(formatSql(options))
)

beforeAll(() => {
  // @ts-ignore
  MysqlServer.prototype.execute = execute
  execute.mockClear()
})

afterAll(() => {
  // console.log('afterAll')
})
