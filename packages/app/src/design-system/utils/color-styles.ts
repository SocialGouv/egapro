import { type UniqueString } from "@common/utils/types";

export type BackgroundColorStyle =
  | UniqueString
  | "background-action-low-blue-france"
  | "background-alt-blue-france"
  | "background-alt-grey"
  | "background-contrast-grey"
  | "background-flat-success";

export type TextColorStyle =
  | UniqueString
  | "text-default-error"
  | "text-default-grey"
  | "text-default-success"
  | "text-mention-grey"
  | "text-title-blue-france"
  | "text-title-grey";
