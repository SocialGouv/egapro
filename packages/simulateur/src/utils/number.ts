export const asPercentage = (value?: number): number | undefined => {
  // Return `33` for "33%" (which is passed in as a value of 0.33)
  if (value !== undefined) {
    return value * 100
  }
}

export const roundDecimal = (num: number, decimal: number): number => {
  const mult = Math.pow(10, decimal)
  return Math.round(num * mult) / mult
}

export const fractionToPercentage = (num: number): number => roundDecimal(num * 100, 5)

export const percentageToFraction = (num: number): number => roundDecimal(num / 100, 5)
