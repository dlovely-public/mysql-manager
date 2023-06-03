import { fill, hasOwn, isArray } from '@dlovely/utils'
import type { SqlWithParams } from './virtual-sql'

export namespace Insert {
  export interface Options {
    database?: string
    table: string
    datas: Record<string, unknown> | Record<string, unknown>[]
    json_key?: Map<string, string>
  }
}

interface InsertContext {
  insert_amount: number
  insert_data: Map<string, unknown[]>
}

export const formatInsert = (options: Insert.Options): SqlWithParams => {
  const { database, table, datas, json_key } = options
  const ctx: InsertContext = { insert_amount: 0, insert_data: new Map() }
  if (isArray(datas)) {
    for (const data of datas) {
      formatInsertData.call(ctx, data)
    }
  } else {
    formatInsertData.call(ctx, datas)
  }
  const keys = [] as string[]
  const vals = Array.from({ length: ctx.insert_amount }, () => [] as unknown[])
  ctx.insert_data.forEach((val_list, key) => {
    keys.push(key)
    const defa = json_key && json_key.get(key)
    for (const i in val_list) {
      const val = val_list[i] ?? defa
      vals[i].push(val)
    }
  })
  if (!keys.length) {
    throw new Error('unless 1 keys')
  }
  json_key?.forEach((defa, key) => {
    if (keys.includes(key)) return
    keys.push(key)
    for (const val of vals) {
      val.push(defa)
    }
  })
  const params = vals.flat()
  const _table = database ? `${database}.${table}` : table
  return {
    sql: `INSERT INTO ${_table} (${keys.join()}) VALUES ${fill(
      ctx.insert_amount,
      `(${fill(keys.length)})`
    )}`,
    params,
  }
}

function formatInsertData(
  this: InsertContext,
  data: Record<string, unknown>
): void {
  const need_do = new Set(this.insert_data.keys())
  for (const key in data) {
    /* istanbul ignore else -- @preserve */
    if (hasOwn(data, key)) {
      const val = data[key]
      const datas = this.insert_data.get(key)
      if (datas) {
        datas.push(val)
        need_do.delete(key)
      } else {
        const datas = new Array(this.insert_amount).fill(null)
        datas.push(val)
        this.insert_data.set(key, datas)
      }
    }
  }
  for (const key of need_do) {
    this.insert_data.get(key)?.push(null)
  }
  this.insert_amount += 1
}
