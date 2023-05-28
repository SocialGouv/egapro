import { notFound } from "next/navigation";
import { type NextRequest, type NextResponse } from "next/server";
import { type z } from "zod";

import { type Any, type ClearObject, type EmptyObject } from "./types";

export type NextErrorPageProps = { error: Error; reset: VoidFunction };

type SearchParamsString<T> = [T] extends [infer R extends string]
  ? "" extends R
    ? EmptyObject
    : {
        searchParams: Partial<Record<R, string[] | string>>;
      }
  : never;

type SearchParamsObject<T> = T extends z.ZodType
  ? never
  : T extends object
  ? {
      searchParams: Partial<T>;
    }
  : never;

type SearchParamsZod<T> = T extends z.ZodType
  ? {
      searchParams: ClearObject<z.infer<T>>;
      searchParamsError?: z.typeToFlattenedError<T>;
    }
  : never;

export type NextServerPageProps<
  Param extends string = string,
  SearchParams extends z.ZodType | object | string = never,
> = {
  params: Record<Param, string>;
} & (SearchParamsObject<SearchParams> | SearchParamsString<SearchParams> | SearchParamsZod<SearchParams>);

export type ValidationOptions = {
  notFound?: boolean;
};

type ZodNextPage<TSchema extends z.ZodType> = (
  props: NextServerPageProps<string, TSchema>,
) => JSX.Element | Promise<JSX.Element>;

export const withSearchParamsValidation =
  <TSchema extends z.ZodType, TPage extends ZodNextPage<TSchema>>(schema: TSchema, options?: ValidationOptions) =>
  (page: TPage): ((...args: Any[]) => JSX.Element | Promise<JSX.Element>) =>
  props => {
    const parseResult = schema.safeParse((props as SearchParamsZod<TSchema>).searchParams);
    if (parseResult.success) {
      return page({ ...props, searchParams: parseResult.data });
    }

    if (options?.notFound) {
      notFound();
    }

    return page({ ...props, searchParamsError: parseResult.error.flatten() });
  };

export type NextRouteHandler<TParams extends string = string> = (
  req: NextRequest,
  context: {
    params: {
      [T in TParams as T extends `...${infer R extends string}` ? R : T]: T extends `...${string}` ? string[] : string;
    };
  },
) => NextResponse | Promise<NextResponse | Response> | Response;
