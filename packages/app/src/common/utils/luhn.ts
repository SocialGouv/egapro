export const checksum = (num: number | string) => {
  const arr = `${num}`
    .split("")
    .reverse()
    .map(x => parseInt(x));
  const [lastDigit, ...digits] = arr;
  let sum = digits.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
  sum += lastDigit;
  return sum % 10;
};

export const computeCheckDigit = (partialNum: number | string) => {
  const checkDigit = checksum(`${partialNum}0`);
  if (checkDigit === 0) {
    return 0;
  }
  return `${10 - checkDigit}`;
};

export const isValid = (num: number | string) => checksum(num) === 0;

export const generateLuhnNumber = (partialNum: number | string) => `${partialNum}${computeCheckDigit(partialNum)}`;
