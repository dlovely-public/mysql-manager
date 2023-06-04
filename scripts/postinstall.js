// @ts-check
import { dirname, join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

const dev_type_path = join(__dirname, '../packages', 'dev-type.d.ts')

const mysql = require('./dev-type.json')

const dev_type_content = [
  `/**`,
  ` * This file is auto generated by scripts/postinstall.js`,
  ` * Please do not modify this file directly`,
  ` * Please modify the file scripts/postinstall.js`,
  ` * and run npm run postinstall`,
  ` * to generate this file`,
  ` */`,
  ``,
]

/** @type {string[]} */
const database_content = []

/** @type {string[]} */
const table_content = []

/** @type {string[]} */
const column_content = []

for (const [database_name, database] of Object.entries(mysql)) {
  const _database_content = [`    ${database_name}: {`]
  for (const [table_name, table] of Object.entries(database)) {
    const _table_name = `'${database_name}.${table_name}'`
    _database_content.push(`      ${table_name}: Table[${_table_name}]`)
    const _table_content = [`    ${_table_name}: {`]
    for (const [column_name, column] of Object.entries(table)) {
      const _column_name = `'${database_name}.${table_name}.${column_name}'`
      _table_content.push(`      ${column_name}: Column[${_column_name}]`)
      const _column_content = [`    ${_column_name}: {`]
      const { type, readonly, not_null, has_defa } = column
      _column_content.push(`      type: ${type}`)
      _column_content.push(`      readonly: ${readonly}`)
      _column_content.push(`      not_null: ${not_null}`)
      _column_content.push(`      has_defa: ${has_defa}`)
      _column_content.push(`    }`)
      column_content.push(_column_content.join('\n'))
    }
    _table_content.push(`    }`)
    table_content.push(_table_content.join('\n'))
  }
  _database_content.push(`    }`)
  database_content.push(_database_content.join('\n'))
}

dev_type_content.push(`declare namespace MySql {`)
dev_type_content.push(`  export interface DataBase {`)
dev_type_content.push(database_content.join('\n'))
dev_type_content.push(`  }`)
dev_type_content.push(`  export interface Table {`)
dev_type_content.push(table_content.join('\n'))
dev_type_content.push(`  }`)
dev_type_content.push(`  export interface Column {`)
dev_type_content.push(column_content.join('\n'))
dev_type_content.push(`  }`)
dev_type_content.push(`}`)
dev_type_content.push(``)

writeFileSync(dev_type_path, dev_type_content.join('\n'), {
  flag: 'w+',
  encoding: 'utf-8',
})