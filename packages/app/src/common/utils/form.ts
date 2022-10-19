export const RadioInputValues = ["non", "oui"] as const;

export const radioStringToBool = (radioInput: typeof RadioInputValues[number]): boolean => radioInput === "oui";

export const radioBoolToString = (value: boolean | undefined): typeof RadioInputValues[number] =>
  value ? "oui" : "non";
