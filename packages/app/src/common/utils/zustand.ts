import { type StoreApi, type UseBoundStore } from "zustand";

import { type Any } from "./types";

type MapFromStore<
  T extends UseBoundStore<StoreApi<Any>>,
  K extends [...Array<keyof S>],
  S = T extends UseBoundStore<StoreApi<infer R>> ? R : never,
> = {
  [Prop in keyof K]: S[K[Prop]];
};

/**
 * Pick only chosen props from zustand store (as react hook).
 *
 * Usefull to avoid multiline and avoid extract all.
 */
export const pickFromStore = <T, K extends [...Array<keyof T>]>(storeHook: UseBoundStore<StoreApi<T>>, ...props: K) =>
  props.map(prop => storeHook(state => state[prop])) as MapFromStore<typeof storeHook, typeof props>;

/**
 * Same as {@link pickFromStore} but in curry form.
 */
export const storePicker =
  <T>(storeHook: UseBoundStore<StoreApi<T>>) =>
  <K extends [...Array<keyof T>]>(...props: K) =>
    props.map(prop => storeHook(state => state[prop])) as MapFromStore<typeof storeHook, typeof props>;
