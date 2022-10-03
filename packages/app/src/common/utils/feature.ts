export const isOpenFeature = (value: string | undefined) => {
  return /on/i.test(value || "");
};
