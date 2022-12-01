import { format } from "date-fns";

export async function getLastModifiedDateFile(url: string): Promise<string> {
  try {
    const responseCsv = await fetch(url, { method: "HEAD" });
    const date = responseCsv?.headers?.get("last-modified");

    if (date) {
      const lastModified = new Date(date);
      return format(lastModified, "dd/MM/yyyy");
    }
  } catch (error) {
    console.error(`Error on fetch HEAD {url}`, error);
  }
  return "";
}
