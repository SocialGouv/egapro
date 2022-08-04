export function capitalize(string: string) {
  return string && string.length ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : ""
}
