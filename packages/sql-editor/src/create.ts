import type { SqlWithParams } from './virtual-sql'

export namespace Create {
  export interface Options {
    charset?: string
  }

  export interface DataBase {
    name: string
    if_not_exists?: boolean
    charset?: string
    collate?: string
  }
}

export const formatCreateDatabase = (
  options: Create.DataBase
): SqlWithParams => {
  const { name, if_not_exists, charset, collate } = options
  let sql = `CREATE DATABASE`
  const params: any[] = []
  if (if_not_exists) {
    sql += ' IF NOT EXISTS'
  }
  sql += ' ?'
  params.push(name)
  if (charset) {
    sql += ' CHARACTER SET ?'
    params.push(charset)
  }
  if (collate) {
    sql += ' COLLATE ?'
    params.push(collate)
  }
  return { sql, params }
}
