export const checksum = (num: number | string) => {
  const code = `${num}`;
  const len = code.length;
  const parity = len % 2;
  let sum = 0;
  for (let i = len - 1; i >= 0; i--) {
    let d = parseInt(code.charAt(i));
    if (i % 2 == parity) {
      d *= 2;
    }
    if (d > 9) {
      d -= 9;
    }
    sum += d;
  }
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
