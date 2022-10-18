export const RadioInputValues = ["non", "oui"] as const;

export const strRadioToBool = (radioInput: typeof RadioInputValues[number]): boolean => {
  if (radioInput === "oui") return true;
  return false;
};
