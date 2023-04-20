import { fr } from "@codegouvfr/react-dsfr";
import { Download } from "@codegouvfr/react-dsfr/Download";
import { format } from "date-fns";
import mime from "mime";

interface DetailedDownloadProps {
  href: string;
  label: (date: string) => string;
}
export const DetailedDownload = async ({ href, label }: DetailedDownloadProps) => {
  const response = await fetch(href, { method: "HEAD" });

  const lastModified = response.headers.get("last-modified");
  const contentLength = response.headers.get("content-length");
  const contentType = response.headers.get("content-type");

  if (!response.ok || !lastModified || !contentLength) {
    return null;
  }

  const formattedLastModified = format(new Date(lastModified), "dd/MM/yyyy");
  const details: string[] = [];
  if (contentType) {
    const ext = mime.getExtension(contentType);
    ext && details.push(ext.toLocaleUpperCase());
  }
  details.push(`${Math.round(Number(contentLength) / 1000)}Ko`);

  return (
    <Download
      className={fr.cx("fr-mt-3w")}
      label={label(formattedLastModified)}
      details={details.join(" - ")}
      linkProps={{ href }}
    />
  );
};
