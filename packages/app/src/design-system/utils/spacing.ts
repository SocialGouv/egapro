import type { theme } from "./theme";

export type Props = keyof typeof theme["space"];

export type SpacingProps = {
  mb?: Props;
  ml?: Props;
  mr?: Props;
  mt?: Props;
  mx?: Props | "auto";
  my?: Props;
  pb?: Props;
  pl?: Props;
  pr?: Props;
  pt?: Props;
  px?: Props;
  py?: Props;
};

export type MarginProps = Omit<SpacingProps, "pb" | "pl" | "pr" | "pt" | "px" | "py">;

export type PaddingProps = Omit<SpacingProps, "mb" | "ml" | "mr" | "mt" | "mx" | "my">;
