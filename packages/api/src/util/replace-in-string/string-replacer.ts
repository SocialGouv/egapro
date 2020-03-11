interface Context {
  [id: string]: string;
}

export default function stringReplacer(
  template: string,
  context: Context
): string {
  return Object.keys(context).reduce(
    (workingTemplate, key) =>
      workingTemplate.replace(RegExp(`\\{\\{${key}}}`, "g"), context[key]),
    template
  );
}
