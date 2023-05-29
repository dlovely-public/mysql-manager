import { describe, it, expectTypeOf } from 'vitest'
import {
  TableColumnsName,
  TableColumnsRecordName,
  ColumnsName,
  TableColumnsRecordMap,
  InsertColumns,
  IsReadOnly,
  IsRequire,
  IsExist,
  UpdateColumns,
  SelectColumns,
  SelectColumnsPick,
  SelectColumnsRecord,
} from '../src/operation'

describe('operation', () => {
  type Columns1 = [
    {
      name: 'id'
      type: number
      not_null: true
      has_defa: false
      readonly: true
    },
    {
      name: 'name'
      type: string
      not_null: false
      has_defa: false
      readonly: false
    }
  ]
  type Columns2 = [
    {
      name: 'age'
      type: number
      not_null: true
      has_defa: true
      readonly: false
    },
    {
      name: 'sex'
      type: number
      not_null: true
      has_defa: false
      readonly: false
    }
  ]
  type ColumnsRecord = {
    columns1: Columns1
    columns2: Columns2
  }

  it('TableColumnsName', () => {
    expectTypeOf<TableColumnsName<Columns1>>().toEqualTypeOf<'id' | 'name'>()
    expectTypeOf<TableColumnsName<Columns2>>().toEqualTypeOf<'age' | 'sex'>()
  })

  it('TableColumnsRecordName', () => {
    expectTypeOf<TableColumnsRecordName<ColumnsRecord>>().toEqualTypeOf<
      'columns1.id' | 'columns1.name' | 'columns2.age' | 'columns2.sex'
    >()
  })

  it('ColumnsName', () => {
    expectTypeOf<ColumnsName<Columns1, never>>().toEqualTypeOf<'id' | 'name'>()
    expectTypeOf<ColumnsName<never, ColumnsRecord>>().toEqualTypeOf<
      'columns1.id' | 'columns1.name' | 'columns2.age' | 'columns2.sex'
    >()
  })

  it('TableColumnsRecordMap', () => {
    expectTypeOf<TableColumnsRecordMap<ColumnsRecord>>().toEqualTypeOf<{
      columns1: ('id' | 'name')[]
      columns2: ('age' | 'sex')[]
    }>()
  })

  it('IsReadOnly', () => {
    expectTypeOf<IsReadOnly<Columns1[0]>>().toEqualTypeOf<true>()
    expectTypeOf<IsReadOnly<Columns1[1]>>().toEqualTypeOf<false>()
  })

  it('IsRequire', () => {
    expectTypeOf<IsRequire<Columns1[0]>>().toEqualTypeOf<true>()
    expectTypeOf<IsRequire<Columns1[1]>>().toEqualTypeOf<false>()
    expectTypeOf<IsRequire<Columns2[0]>>().toEqualTypeOf<false>()
    expectTypeOf<IsRequire<Columns2[1]>>().toEqualTypeOf<true>()
  })

  it('IsExist', () => {
    expectTypeOf<IsExist<Columns1[0]>>().toEqualTypeOf<true>()
    expectTypeOf<IsExist<Columns1[1]>>().toEqualTypeOf<false>()
    expectTypeOf<IsExist<Columns2[0]>>().toEqualTypeOf<true>()
    expectTypeOf<IsExist<Columns2[1]>>().toEqualTypeOf<true>()
  })

  it('InsertColumns', () => {
    expectTypeOf<InsertColumns<Columns1>>().toEqualTypeOf<{ name?: string }>()
  })

  it('UpdateColumns', () => {
    expectTypeOf<UpdateColumns<Columns1>>().toEqualTypeOf<{ name?: string }>()
  })

  it('SelectColumns', () => {
    expectTypeOf<SelectColumns<Columns1>>().toEqualTypeOf<{
      readonly id: number
      name?: string
    }>()
  })

  it('SelectColumnsPick', () => {
    expectTypeOf<SelectColumnsPick<Columns1, 'id'>>().toEqualTypeOf<{
      readonly id: number
    }>()
    expectTypeOf<SelectColumnsPick<Columns1, never>>().toEqualTypeOf<{
      readonly id: number
      name?: string
    }>()
  })

  it('SelectColumnsRecord', () => {
    expectTypeOf<SelectColumnsRecord<ColumnsRecord, never>>().toEqualTypeOf<{
      readonly id: number
      name?: string
      age: number
      sex: number
    }>()
    expectTypeOf<
      SelectColumnsRecord<
        ColumnsRecord,
        {
          columns1: 'id'[]
          columns2: 'age'[]
        }
      >
    >().toEqualTypeOf<{
      readonly id: number
      age: number
    }>()
  })
})
