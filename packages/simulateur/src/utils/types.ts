/**
 * Stub to trick eslint.
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = any

export type UniqueString<TStr extends string = string> = TStr & {
  _?: never & symbol
}

export type UnknownMapping = UniqueString<string>

export type UnionToIntersection<TUnion> = (TUnion extends Any ? (k: TUnion) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never
type UnionToOverloads<TUnion> = UnionToIntersection<TUnion extends Any ? (f: TUnion) => void : never>
export type PopUnion<TUnion> = UnionToOverloads<TUnion> extends (a: infer A) => void ? A : never

export type PushToArray<T extends Any[], V> = [...T, V]

/** @deprecated - Dangerous as unions can be moved by linters */
export type TuplifyUnion<T, L = PopUnion<T>, N = [T] extends [never] ? true : false> = true extends N
  ? []
  : PushToArray<TuplifyUnion<Exclude<T, L>>, L>
