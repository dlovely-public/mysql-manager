import { Create, formatCreateDatabase } from '@dlovely/sql-editor'
import { useServer } from './mysql'
import { database_control } from './file-control'

export class DataBase<DB extends keyof MySql.DataBase> {
  constructor(public readonly name: DB) {}

  // TODO 智能类型
  // ! 有点问题，不能用
  /* istanbul ignore next -- @preserve */
  public async setConfig({
    charset = 'utf8mb4',
    collate = 'utf8mb4_general_ci',
  }) {
    const server = useServer()
    const result = await server.execute({
      sql: `ALTER DATABASE ? CHARACTER SET ? COLLATE ?`,
      params: [this.name, charset, collate],
    })
    return result
  }

  /**
   * 创建数据库
   */
  public async create(options: Omit<Create.DataBase, 'name'> = {}) {
    const server = useServer()
    const sql = formatCreateDatabase({
      name: this.name,
      ...options,
    })
    const result = await server.execute(sql)
    /* istanbul ignore next -- @preserve */
    if (__DEV__ && !__TEST__) database_control.load(this.name)
    return result
  }

  /** 抛弃数据库 */
  public async drop() {
    const server = useServer()
    const result = await server.execute({
      sql: `DROP DATABASE IF EXISTS ?`,
      params: [this.name],
    })
    /* istanbul ignore next -- @preserve */
    if (__DEV__ && !__TEST__) database_control.drop(this.name)
    return result
  }
}
