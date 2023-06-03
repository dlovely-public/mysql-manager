import { SqlWithParams, formatSql } from '@dlovely/sql-editor'
import { isArray } from '@dlovely/utils'
import type { Connection, OkPacket, PoolConnection } from 'mysql2/promise'

export class Transaction {
  constructor(
    private type: 'connection' | 'pool',
    private readonly connection: Connection | PoolConnection
  ) {}

  private _active = false
  public get active() {
    return this._active
  }

  public async begin() {
    if (this._active) return
    await this.connection.beginTransaction()
    this._active = true
  }

  /**
   * 调用连接执行execute，并自动释放连接
   * @ 不传入泛型提示返回OkPacket
   */
  public async execute(
    options: string | Partial<SqlWithParams>
  ): Promise<OkPacket>
  /**
   * 调用连接执行execute，并自动释放连接
   * @ 传入泛型提示返回类型数组
   */
  public async execute<T extends Record<string, unknown>>(
    options: string | Partial<SqlWithParams>
  ): Promise<T[]>
  /* istanbul ignore next -- @preserve */
  public async execute(options: string | Partial<SqlWithParams>): Promise<any> {
    if (!this._active) throw new Error('Transaction not begin')
    try {
      const { sql, params } = formatSql(options)
      // TODO 错误处理
      const result = await this.connection.execute(sql, params)
      return (isArray(result) ? result[0] : result) as any
    } catch (err: any) {
      this._handleError(err)
      this._rollback()
      await this.release()
    }
  }

  public async commit() {
    if (!this._active) throw new Error('Transaction not begin')
    try {
      await this.connection.commit()
      this._active = false
    } catch (err: any) {
      await this._handleError(err)
      await this._rollback()
    } finally {
      await this.release()
    }
  }

  private _handleError = async function (this: Transaction, err: Error) {
    console.error(err)
  }
  public setHandleError(handleError: typeof this._handleError) {
    this._handleError = handleError.bind(this)
  }

  public async release() {
    if (this._active) throw new Error('Transaction is active')
    if (this.type === 'pool') {
      ;(this.connection as PoolConnection).release()
    } else {
      await (this.connection as Connection).end()
    }
  }

  private async _rollback() {
    this._active = false
    await this.connection.rollback()
  }
  public async rollback() {
    if (!this._active) throw new Error('Transaction not begin')
    this._rollback()
    await this.release()
  }
}
