import { vi, afterAll, beforeAll } from 'vitest'
import type { PoolConnection } from 'mysql2/promise'
import { SqlWithParams, formatSql } from '@dlovely/sql-editor'
import { MysqlServer } from '../src/mysql'
import { Transaction } from '../src/transaction'

export const execute = vi.fn((options: Partial<SqlWithParams>) =>
  Promise.resolve(formatSql(options))
)

export const beginTransaction = vi.fn(() => Promise.resolve())
export const commit = vi.fn(() => Promise.resolve())
export const rollback = vi.fn(() => Promise.resolve())
export const release = vi.fn(() => Promise.resolve())

export const connection: PoolConnection = {
  execute,
  beginTransaction,
  commit,
  rollback,
  release,
  end: release,
} as any

beforeAll(() => {
  // @ts-ignore
  MysqlServer.prototype.execute = execute
  // @ts-ignore
  MysqlServer.prototype.getConnection = async function (this: MysqlServer) {
    const { active_database } = this
    return { active_database, connection, release }
  }
  // @ts-ignore
  MysqlServer.prototype.transaction = async function (this: MysqlServer) {
    return new Transaction(this.type, connection)
  }
})

afterAll(() => {
  for (const mock of [execute, beginTransaction, commit, rollback, release]) {
    mock.mockClear()
  }
})
