/** @jsx jsx */
import { jsx } from "@emotion/core";
import { format } from "date-fns";
import {useEffect, useState} from "react";
import {CSV_DOWNLOAD_URL} from "./env";

const CsvUpdateDate = () => {
  const [csvUpdateDate, setCsvUpdateDate] = useState("");
  useEffect(() => {
    fetch(CSV_DOWNLOAD_URL, { method: "HEAD"})
      .then(response => {
        const lastModifiedDate = response.headers.get("last-modified");
        if (lastModifiedDate) {
          setCsvUpdateDate(format(new Date(lastModifiedDate), "dd/MM/yyyy HH:mm"));
        }
      })
  }, [setCsvUpdateDate]);

  return <span>
    {csvUpdateDate}
  </span>
};

export  default CsvUpdateDate;
