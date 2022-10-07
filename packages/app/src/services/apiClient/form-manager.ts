import { useEffect, useState } from "react";

import type { EntrepriseType } from "./siren";

const KEY = "répartition-équilibrée-form";

type RepartitionEquilibreeForm = {
  endOfPeriod?: string;
  entreprise?: EntrepriseType;
  year?: number;
  // TODO: add properties for the future pages
};

export const save = (data: RepartitionEquilibreeForm) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};

export const get = () => {
  const data = localStorage.getItem(KEY);

  return data === null ? {} : JSON.parse(data);
};

export const useFormManager = () => {
  const [formData, setFormData] = useState<RepartitionEquilibreeForm>({});

  // Get data from local storage on component's mount.
  useEffect(() => {
    setFormData(get());
  }, []);

  return { formData, saveFormData: save };
};
