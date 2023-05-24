export const compare = (num_1: number, num_2: number) =>
  num_1 < num_2 ? [num_1, num_2] : [num_2, num_1]

export const fill = (count: number, slot = '?') =>
  new Array(count).fill(slot).join()

export type DoPick<T, K> = T extends any
  ? {
      [Key in keyof T as Key extends K ? Key : never]: T[Key]
    }
  : never

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
