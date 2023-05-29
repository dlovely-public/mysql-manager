import { createConnection, createPool } from 'mysql2/promise'
import type { Connection, PoolConnection, Pool, OkPacket } from 'mysql2/promise'
import { formatSql } from '@dlovely/sql-editor'
import type { SqlWithParams } from '@dlovely/sql-editor'
import { genConfig } from './config'
import { genGlobalType } from './auto-type'

export class MysqlServer {
  public readonly type
  public readonly config
  public readonly options
  public readonly json_key
  constructor() {
    const { type, config, database, json_key } = genConfig()
    this.type = type
    this.config = config
    this.options = database
    this._active_database = config.database
    this.json_key = json_key
  }

  private _active_database
  /** 当前选中的database */
  public get active_database() {
    return this._active_database
  }
  /** 切换选中的database */
  public use(database: string) {
    if (this.type === 'connection') {
      this._active_database = database
      this.config.database = database
    }
  }

  private _pool?: Pool
  /** 从配置处获取连接 */
  public async getConnection(): Promise<{
    active_database?: string
    connection: Connection
    release: () => void
  }>
  /**
   * 从配置处获取连接
   * @ 传入泛型以明确表示从连接池获取连接
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getConnection<T extends true>(): Promise<{
    active_database?: string
    connection: PoolConnection
    release: () => void
  }>
  /** 从配置处获取连接 */
  public async getConnection() {
    const { active_database } = this
    /* istanbul ignore else -- @preserve */
    if (__TEST__)
      return {
        active_database,
        connection: Symbol.for('test') as unknown as Connection,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        release: () => {},
      }
    /* istanbul ignore next -- @preserve */
    if (this.type === 'pool') {
      if (!this._pool) this._pool = createPool(this.config)
      const connection = await this._pool.getConnection()
      const release = () => connection.release()
      return { active_database, connection, release }
    } else {
      const connection = await createConnection(this.config)
      const release = () => connection.end()
      return { active_database, connection, release }
    }
  }

  /**
   * 调用连接执行execute，并自动释放连接
   * @ 不传入泛型提示返回OkPacket
   */
  public async execute(
    options: string | Partial<SqlWithParams>,
    database?: string
  ): Promise<OkPacket>
  /**
   * 调用连接执行execute，并自动释放连接
   * @ 传入泛型提示返回类型数组
   */
  public async execute<T extends Record<string, unknown>>(
    options: string | Partial<SqlWithParams>,
    database?: string
  ): Promise<T[]>
  /* istanbul ignore next -- @preserve */
  public async execute(
    options: string | Partial<SqlWithParams>,
    database?: string
  ): Promise<any> {
    const { sql, params } = formatSql(options)
    const { active_database, connection, release } = await this.getConnection()
    if (database && database !== active_database) {
      await connection.changeUser({ database })
    }
    // TODO 错误处理
    const [result] = await connection.execute(sql, params)
    release()
    return result as any
  }
}

let server: MysqlServer | null = null
export const useServer = () => {
  if (!server) {
    server = new MysqlServer()
    /* istanbul ignore next -- @preserve */
    if (__DEV__ && !__TEST__) genGlobalType({ json_key: server.json_key })
  }
  return server
}
