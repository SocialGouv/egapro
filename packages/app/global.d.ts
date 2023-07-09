declare module "@json2csv/*";
declare module "js-xlsx" {
  export * from "xlsx";
}

declare module "server-only";

declare module "*.woff" {
  const content: string;

  // eslint-disable-next-line import/no-default-export
  export default content;
}

declare module "*.woff2" {
  const content: string;

  // eslint-disable-next-line import/no-default-export
  export default content;
}
