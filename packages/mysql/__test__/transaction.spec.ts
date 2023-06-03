import { describe, it, beforeEach, afterEach } from 'vitest'
import {
  execute,
  beginTransaction,
  commit,
  rollback,
  release,
} from './mysql-server'
import { useServer, MysqlServer } from '../src/mysql'
import { SqlWithParams, formatSql } from '@dlovely/sql-editor'
import type { PoolConnection } from 'mysql2/promise'
import { Transaction } from '../src/transaction'

describe('transaction', () => {
  it('active', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    expect(transaction.active).toBe(false)
    await transaction.begin()
    expect(transaction.active).toBe(true)
    await transaction.commit()
    expect(transaction.active).toBe(false)
    beginTransaction.mockClear()
    commit.mockClear()
    release.mockClear()
  })

  it('release without commit and rollback', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    await transaction.begin()
    beginTransaction.mockClear()
    expect(() => transaction.release()).rejects.toThrowError(
      'Transaction is active'
    )
  })

  it('release', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    await transaction.release()
    expect(release).toBeCalledTimes(1)
    release.mockClear()
  })

  it('begin', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    await transaction.begin()
    expect(beginTransaction).toBeCalledTimes(1)
    await transaction.begin()
    expect(beginTransaction).toBeCalledTimes(1)
    beginTransaction.mockClear()
  })

  it('commit without begin', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    expect(() => transaction.commit()).rejects.toThrowError(
      'Transaction not begin'
    )
  })

  it('commit', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    await transaction.begin()
    await transaction.commit()
    expect(commit).toBeCalledTimes(1)
    expect(rollback).toBeCalledTimes(0)
    expect(release).toBeCalledTimes(1)
    beginTransaction.mockClear()
    commit.mockClear()
    release.mockClear()
  })

  it('rollback without begin', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    expect(() => transaction.rollback()).rejects.toThrowError(
      'Transaction not begin'
    )
  })

  it('rollback', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    await transaction.begin()
    await transaction.rollback()
    expect(beginTransaction).toBeCalledTimes(1)
    expect(rollback).toBeCalledTimes(1)
    expect(commit).toBeCalledTimes(0)
    expect(release).toBeCalledTimes(1)
    beginTransaction.mockClear()
    rollback.mockClear()
    release.mockClear()
  })

  it('execute without begin', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    expect(() => transaction.execute('')).rejects.toThrowError(
      'Transaction not begin'
    )
  })

  it('execute', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    await transaction.begin()
    await transaction.execute('')
    await transaction.commit()
    expect(beginTransaction).toBeCalledTimes(1)
    expect(execute).toBeCalledTimes(1)
    expect(commit).toBeCalledTimes(1)
    expect(rollback).toBeCalledTimes(0)
    expect(release).toBeCalledTimes(1)
    beginTransaction.mockClear()
    execute.mockClear()
    commit.mockClear()
    release.mockClear()
  })
})

describe('transaction error', () => {
  const execute = vi.fn((options: Partial<SqlWithParams>) =>
    Promise.reject(formatSql(options))
  )
  const commit = vi.fn(() => Promise.reject())

  const connection: PoolConnection = {
    execute,
    beginTransaction,
    commit,
    rollback,
    release,
    end: release,
  } as any

  beforeEach(() => {
    // @ts-ignore
    MysqlServer.prototype.getConnection = async function (this: MysqlServer) {
      const { active_database } = this
      return { active_database, connection, release }
    }
    // @ts-ignore
    MysqlServer.prototype.transaction = async function (this: MysqlServer) {
      return new Transaction('connection', connection)
    }
  })

  afterEach(() => {
    execute.mockClear()
    commit.mockClear()
  })

  it('execute', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    await transaction.begin()
    await transaction.execute('')
    expect(beginTransaction).toBeCalledTimes(1)
    expect(execute).toBeCalledTimes(1)
    expect(commit).toBeCalledTimes(0)
    expect(rollback).toBeCalledTimes(1)
    expect(release).toBeCalledTimes(1)
    beginTransaction.mockClear()
    execute.mockClear()
    rollback.mockClear()
    release.mockClear()
  })

  it('commit', async ({ expect }) => {
    const server = useServer()
    const transaction = await server.transaction()
    await transaction.begin()
    await transaction.commit()
    expect(beginTransaction).toBeCalledTimes(1)
    expect(commit).toBeCalledTimes(1)
    expect(rollback).toBeCalledTimes(1)
    expect(release).toBeCalledTimes(1)
    beginTransaction.mockClear()
    commit.mockClear()
    rollback.mockClear()
    release.mockClear()
  })

  it('setHandleError', async ({ expect }) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleError = vi.fn(async () => {})

    const server = useServer()
    const transaction = await server.transaction()
    transaction.setHandleError(handleError)
    await transaction.begin()
    await transaction.commit()
    expect(beginTransaction).toBeCalledTimes(1)
    expect(commit).toBeCalledTimes(1)
    expect(rollback).toBeCalledTimes(1)
    expect(handleError).toBeCalledTimes(1)
    expect(release).toBeCalledTimes(1)
    beginTransaction.mockClear()
    commit.mockClear()
    rollback.mockClear()
    release.mockClear()
  })
})
