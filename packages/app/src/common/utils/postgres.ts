export const cleanFullTextSearch = (text: string) => {
  if (!text) return text;

  const escapeReg = /(&|\(|\))/gi;
  const cleanText = text
    .replace(escapeReg, " ")
    .split(" ")
    .filter(str => str)
    .join(" ")
    .replaceAll(" ", " & ");
  return cleanText.endsWith("*") ? cleanText : `${cleanText}:*`;
};
