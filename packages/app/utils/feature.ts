export function isOpenFeature(value: string | undefined) {
  return /on/i.test(value || "")
}
