import { createConnection, createPool } from 'mysql2/promise'
import type { Connection, Pool } from 'mysql2/promise'
import type { ConnectionOptions } from 'mysql2/typings/mysql/lib/Connection'
import type { PoolOptions } from 'mysql2/typings/mysql/lib/Pool'
import { DataBase } from './database'
import { mergeConfig } from './config'

export interface MysqlInstace {
  readonly active: boolean
  getConnection(): Promise<{
    connection: Connection
    release: () => void
  }>
  createDataBase(name: string): DataBase
}

class Mysql<Config extends ConnectionOptions | PoolOptions> {
  public config
  constructor(config?: Config, is_database = false) {
    is_database || (config && Reflect.deleteProperty(config, 'database'))
    this.config = mergeConfig(config)
  }

  protected _restart(config?: Config, cb?: () => void) {
    const _config = mergeConfig(config)
    if (JSON.stringify(this.config) !== JSON.stringify(_config)) {
      this.config = _config
      cb?.()
    }
  }

  protected _active = true
  public get active() {
    return this._active
  }

  public database_cache = new Map<string, DataBase>()
  public cleanUpCache(...keys: string[]) {
    if (keys.length) {
      for (const key of keys) {
        this.database_cache.delete(key)
      }
    } else {
      this.database_cache.clear()
    }
  }
  protected _createDataBase(
    name: string,
    creator: (name: string) => DataBase
  ): DataBase {
    let database = this.database_cache.get(name)
    if (!database) {
      database = creator(name)
      this.database_cache.set(name, database)
    }
    return database
  }
}

export class MysqlServer
  extends Mysql<ConnectionOptions>
  implements MysqlInstace
{
  public restart(config?: ConnectionOptions) {
    this._restart(config)
  }

  private _connection?: Connection
  public get connection() {
    return this._connection
  }
  public async getConnection() {
    const connection = __TEST__
      ? (this._connection = Symbol.for(
          'test connection'
        ) as unknown as Connection)
      : /* istanbul ignore next -- @preserve */
        this._connection ??
        (this._connection = await createConnection(this.config))
    const release = () => {
      this._connection = undefined
    }
    return { connection, release }
  }

  public createDataBase(name: string): DataBase {
    return this._createDataBase(name, name => new DataBase(this, name))
  }
}

export class MysqlPool extends Mysql<PoolOptions> implements MysqlInstace {
  public restart(config?: PoolOptions) {
    this._restart(config, () => {
      this._pool = undefined
    })
  }

  private _pool?: Pool
  /* istanbul ignore next -- @preserve */
  public get pool() {
    if (this._pool) return this._pool
    return (this._pool = createPool(this.config))
  }
  /* istanbul ignore next -- @preserve */
  public async getConnection() {
    const { connection, release } = await this.pool.getConnection()
    return { connection, release }
  }

  public createDataBase(name: string): DataBase {
    return this._createDataBase(name, name => new DataBase(this, name))
  }
}

let active_mysql_server: MysqlServer | null = null
export const createMysqlServer = (config?: ConnectionOptions) => {
  if (active_mysql_server && active_mysql_server.active) {
    active_mysql_server.restart(config)
    return active_mysql_server
  }
  return (active_mysql_server = new MysqlServer(config))
}

let active_mysql_pool: MysqlPool | null = null
export const createMysqlPool = (config?: PoolOptions) => {
  if (active_mysql_pool && active_mysql_pool.active) {
    active_mysql_pool.restart(config)
    return active_mysql_pool
  }
  return (active_mysql_pool = new MysqlPool(config))
}

export function useServer(is_pool: true): MysqlPool | null
export function useServer(is_pool: false): MysqlServer | null
export function useServer(is_pool: boolean): MysqlInstace | null
export function useServer(is_pool: boolean) {
  return is_pool ? active_mysql_pool : active_mysql_server
}

export type { ConnectionOptions, PoolOptions }
