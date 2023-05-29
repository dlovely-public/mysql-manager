/* istanbul ignore file -- @preserve */
import { join, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { types_dir_path, global_type_path } from './paths'
import type { Column } from './auto-type'

interface Control {
  path: string
  content: string
}

/*#__PURE*/ class Saver {
  private changed = new Set<Control>()

  public change(control: Control) {
    if (this.changed.has(control)) this.changed.delete(control)
    this.changed.add(control)
    this._start()
  }

  private _timer: NodeJS.Timeout | null = null
  private _start() {
    if (this._timer) return
    this._timer = setTimeout(() => {
      this._timer = null
      this.save()
    }, 0)
  }
  private _stop() {
    if (!this._timer) return
    clearTimeout(this._timer)
    this._timer = null
  }

  private async _save(control: Control) {
    const dir = dirname(control.path)
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    await writeFile(control.path, control.content, {
      flag: 'w',
      encoding: 'utf-8',
    })
  }
  public save() {
    const controls = [...this.changed]
    this.changed.clear()
    this._stop()
    return Promise.all(controls.map(control => this._save(control)))
  }
}
export const saver = /*#__PURE*/ new Saver()

class GlobalControl {
  private _global = new Set<string>()
  public get content() {
    return [...this._global].join('\n')
  }

  public push(path: string) {
    if (this._global.has(path)) return
    this._global.add(path)
    saver.change(this)
  }
  public remove(path: string) {
    if (!this._global.has(path)) return
    this._global.delete(path)
    saver.change(this)
  }

  public readonly path = global_type_path
}
export const global_control = /*#__PURE*/ new GlobalControl()

class DatabaseControl {
  constructor() {
    const name = 'database.d.ts'
    this.path = join(types_dir_path, name)
    this.reference = `/// <reference path="./types/${name}" />`
  }

  private _database = new Map<string, Set<string>>()
  private _content_cache = new Map<string, string>()
  public get content() {
    const content = [`declare namespace MySql {`, `  interface DataBase {`]
    for (const [database_name, table_list] of this._database) {
      if (this._content_cache.has(database_name)) {
        content.push(this._content_cache.get(database_name)!)
        continue
      }
      const database = [`    ${database_name}: {`]
      for (const table_name of table_list) {
        database.push(
          `      ${table_name}: Table['${database_name}.${table_name}']`
        )
      }
      database.push(`    }`)
      const _content = database.join('\n')
      content.push(_content)
      this._content_cache.set(database_name, _content)
    }
    content.push(`  }`, `}`)
    return content.join('\n')
  }

  public load(database_name: string, table_list: Iterable<string> = []) {
    this._database.set(database_name, new Set(table_list))
    saver.change(this)
    global_control.push(this.reference)
  }
  public drop(database_name: string) {
    this._database.delete(database_name)
    this._content_cache.delete(database_name)
    saver.change(this)
  }

  public create(database_name: string, table_name: string) {
    if (!this._database.has(database_name)) this.load(database_name)
    const table_list = this._database.get(database_name)!
    if (table_list.has(table_name)) return
    table_list.add(table_name)
    this._content_cache.delete(database_name)
    saver.change(this)
  }
  public delete(database_name: string, table_name: string) {
    if (!this._database.has(database_name)) return
    const table_list = this._database.get(database_name)!
    if (!table_list.has(table_name)) return
    table_list.delete(table_name)
    if (table_list.size === 0) this.drop(database_name)
    else {
      this._content_cache.delete(database_name)
      saver.change(this)
    }
  }

  public readonly path
  public readonly reference
}
export const database_control = /*#__PURE*/ new DatabaseControl()

class TablesControl {
  private _tables = new Map<string, TableControl>()

  public get(database_name: string, table_name: string) {
    const key = `${database_name}.${table_name}`
    let control = this._tables.get(key)
    if (control) return control
    control = new TableControl(database_name, table_name)
    this._tables.set(key, control)
    database_control.create(database_name, table_name)
    return control
  }
  public delete(database_name: string, table_name: string) {
    const key = `${database_name}.${table_name}`
    if (!this._tables.has(key)) return
    this._tables.delete(key)
    database_control.delete(database_name, table_name)
  }
}
class TableControl {
  constructor(
    public readonly database_name: string,
    public readonly table_name: string
  ) {
    this.path = join(types_dir_path, database_name, `${table_name}.d.ts`)
    this.reference = `/// <reference path="./types/${database_name}/${table_name}.d.ts" />`
    global_control.push(this.reference)
  }

  private _column = new Map<string, Column>()
  private _content_cache = new Map<string, string>()
  public get content() {
    const table = [
      `  interface Table {`,
      `    ['${this.database_name}.${this.table_name}']: {`,
    ]
    const column = [`  interface Column {`]

    for (const [column_name, { type, readonly, not_null, has_defa }] of this
      ._column) {
      table.push(
        `      ${column_name}: Column['${this.database_name}.${this.table_name}.${column_name}']`
      )
      if (this._content_cache.has(column_name)) {
        column.push(this._content_cache.get(column_name)!)
        continue
      }
      const _content = [
        `    ['${this.database_name}.${this.table_name}.${column_name}']: {`,
        `      type: ${type}`,
        `      readonly: ${readonly}`,
        `      not_null: ${not_null}`,
        `      has_defa: ${has_defa}`,
        `    }`,
      ].join('\n')
      column.push(_content)
      this._content_cache.set(column_name, _content)
    }
    table.push(`    }`, `  }`)
    column.push(`  }`)

    return [`declare namespace MySql {`, ...table, ...column, `}`].join('\n')
  }

  public load(column_list: Iterable<[string, Column]> = []) {
    this._column = new Map(column_list)
    saver.change(this)
  }
  public drop() {
    this._column.clear()
    this._content_cache.clear()
    saver.change(this)
    global_control.remove(this.reference)
    tables_control.delete(this.database_name, this.table_name)
  }

  public create(column_name: string, column: Column) {
    if (this._column.has(column_name)) return
    this._column.set(column_name, column)
    saver.change(this)
  }
  public delete(column_name: string) {
    if (!this._column.has(column_name)) return
    this._column.delete(column_name)
    this._content_cache.delete(column_name)
    saver.change(this)
  }

  public readonly path
  public readonly reference
}
export const tables_control = /*#__PURE*/ new TablesControl()
