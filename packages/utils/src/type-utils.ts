export const compare = (num_1: number, num_2: number): [number, number] =>
  num_1 < num_2 ? [num_1, num_2] : [num_2, num_1]

export const fill = (count: number, slot = '?') =>
  new Array(count).fill(slot).join()

export type DoPick<T, K> = T extends any
  ? {
      [Key in keyof T as Key extends K ? Key : never]: T[Key]
    }
  : never

export type Split<
  T extends string,
  D extends string = '.'
> = T extends `${infer F}${D}${infer L}` ? [F, ...Split<L, D>] : [T]

export type MergeRecord<T extends Record<PropertyKey, unknown>> =
  T extends Record<PropertyKey, unknown>
    ? {
        [K in keyof T]: T[K]
      }
    : never
export type MergeRecordWithoutNever<
  T extends Record<PropertyKey, unknown>[],
  R extends Record<PropertyKey, unknown> = {}
> = T extends [infer F, ...infer L extends Array<Record<PropertyKey, unknown>>]
  ? [F] extends [never]
    ? MergeRecordWithoutNever<L, R>
    : MergeRecordWithoutNever<L, R & F>
  : MergeRecord<R>

export type UnionToIntersection<U extends Record<PropertyKey, unknown>> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I extends Record<PropertyKey, unknown>) => void
  ? MergeRecord<I>
  : never

/**
 * UnionToIntersection<{ foo: string } | { bar: string }> =
 *  { foo: string } & { bar: string }.
 */
type UnionToIntersection2<U> = (
  U extends unknown ? (arg: U) => 0 : never
) extends (arg: infer I) => 0
  ? I
  : never

/**
 * LastInUnion<1 | 2> = 2.
 */
type LastInUnion<U> = UnionToIntersection2<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer L) => 0
  ? L
  : never

/**
 * UnionToTuple<1 | 2> = [1, 2].
 */
export type UnionToTuple<U, Last = LastInUnion<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last]
