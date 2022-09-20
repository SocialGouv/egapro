export function capitalize<T extends string>(string: T) {
  return (
    string && string.length ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : ""
  ) as Capitalize<T>;
}
