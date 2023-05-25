import type { ConnectionOptions } from 'mysql2/typings/mysql/lib/Connection'
import type { PoolOptions } from 'mysql2/typings/mysql/lib/Pool'
import { Mysql, useServer } from './mysql'
import { TableColumns, createSql } from '@dlovely/sql-editor'
import { Table } from './table'

export type DataBaseOptions = Omit<
  ConnectionOptions | PoolOptions,
  'database'
> &
  Required<Pick<ConnectionOptions | PoolOptions, 'database'>>

export class DataBase {
  private readonly _is_pool
  constructor(public readonly server: Mysql, public readonly name: string) {
    this._is_pool = 'pool' in server
  }

  public get is_pool() {
    return this._is_pool
  }

  public readonly table_cache = new Map<string, Table<string, any>>()
  public cleanUpCache(...keys: string[]) {
    if (keys.length) {
      for (const key of keys) {
        this.table_cache.delete(key)
      }
    } else {
      this.table_cache.clear()
    }
  }
  public createTable<Name extends string, Columns extends TableColumns>(
    name: Name,
    columns: Columns
  ) {
    let table = this.table_cache.get(name)
    if (!table) {
      table = new Table(this, name, columns)
      this.table_cache.set(name, table)
    }
    return table as Table<Name, Columns>
  }

  public create() {
    return this.server.execute(createSql(`CREATE DATABASE ${this.name}`))
  }

  public drop() {
    return this.server.execute(createSql(`DROP DATABASE ${this.name}`))
  }
}

export const createDataBase = (name: string, is_pool = true) => {
  const server = useServer(is_pool)
  if (!server) throw new Error('no active server')
  return server.createDataBase(name)
}
