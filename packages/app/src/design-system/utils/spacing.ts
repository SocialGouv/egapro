import { type SpacingToken } from "@codegouvfr/react-dsfr";

export type SpacingProps = {
  mb?: SpacingToken;
  ml?: SpacingToken;
  mr?: SpacingToken;
  mt?: SpacingToken;
  mx?: SpacingToken | "auto";
  my?: SpacingToken;
  pb?: SpacingToken;
  pl?: SpacingToken;
  pr?: SpacingToken;
  pt?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
};

export type MarginProps = Omit<SpacingProps, "pb" | "pl" | "pr" | "pt" | "px" | "py">;

export type PaddingProps = Omit<SpacingProps, "mb" | "ml" | "mr" | "mt" | "mx" | "my">;
