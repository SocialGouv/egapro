export type SpacingProps =
  | "0"
  | "1v"
  | "1w"
  | "2w"
  | "3v"
  | "3w"
  | "4w"
  | "5w"
  | "6w"
  | "7w"
  | "8w"
  | "9w"
  | "12w"
  | "15w";

export type MarginProps = {
  mb?: SpacingProps;
  ml?: SpacingProps;
  mr?: SpacingProps;
  mt?: SpacingProps;
  mx?: SpacingProps | "auto";
  my?: SpacingProps;
  pb?: SpacingProps;
  pl?: SpacingProps;
  pr?: SpacingProps;
  pt?: SpacingProps;
  px?: SpacingProps;
  py?: SpacingProps;
};
