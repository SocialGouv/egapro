export const capitalize = <T extends string>(string: T) => {
  return (
    string && string.length ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : ""
  ) as Capitalize<T>;
};

export const strRadioToBool = (radioInput: string): boolean => {
  if (radioInput === "true") return true;
  return false;
};
