import { describe, it, expect, expectTypeOf } from 'vitest'
import {
  compare,
  fill,
  DoPick,
  MergeRecord,
  MergeRecordWithoutNever,
  UnionToIntersection,
} from '../src/type-utils'

describe('type-utils', () => {
  it('compare', () => {
    expect(compare(1, 2)).toEqual([1, 2])
    expect(compare(2, 1)).toEqual([1, 2])
  })

  it('fill', () => {
    expect(fill(0)).toEqual('')
    expect(fill(1)).toEqual('?')
    expect(fill(2)).toEqual('?,?')
    expect(fill(3)).toEqual('?,?,?')
  })

  it('DoPick', () => {
    type T = {
      a: number
      b: string
      c: boolean
    }
    type R = DoPick<T, 'a' | 'b'>
    expectTypeOf<R>().toEqualTypeOf<{ a: number; b: string }>()
  })

  it('MergeRecord', () => {
    type T = {
      a: number
      b: string
    }
    type U = {
      c: boolean
    }
    type R = MergeRecord<T & U>
    expectTypeOf<R>().toEqualTypeOf<T & U>()
  })

  it('MergeRecordWithoutNever', () => {
    type T = {
      a: number
      b: string
    }
    type U = {
      c: boolean
    }
    type R = MergeRecordWithoutNever<[T, U]>
    expectTypeOf<R>().toEqualTypeOf<T & U>()
    type RR = MergeRecordWithoutNever<[T, never, U]>
    expectTypeOf<RR>().toEqualTypeOf<T & U>()
  })

  it('UnionToIntersection', () => {
    type T = {
      a: number
      b: string
    }
    type U = {
      c: boolean
    }
    type R = UnionToIntersection<T | U>
    expectTypeOf<R>().toEqualTypeOf<T & U>()
  })
})
