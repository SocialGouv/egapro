import { type EmptyObject } from "./types";

type SearchParamsString<T> = [T] extends [infer R extends string]
  ? "" extends R
    ? EmptyObject
    : {
        searchParams: Partial<Record<R, string>>;
      }
  : never;

type SearchParamsObject<T> = T extends object
  ? {
      searchParams: Partial<T>;
    }
  : never;

export type NextServerPageProps<Param extends string = string, SearchParams extends object | string = ""> = {
  params: Record<Param, string>;
} & (SearchParamsObject<SearchParams> | SearchParamsString<SearchParams>);
