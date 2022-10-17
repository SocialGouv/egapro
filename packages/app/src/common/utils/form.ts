export type RadioInputValues = "non" | "oui";

export const strRadioToBool = (radioInput: RadioInputValues): boolean => {
  if (radioInput === "oui") return true;
  return false;
};
