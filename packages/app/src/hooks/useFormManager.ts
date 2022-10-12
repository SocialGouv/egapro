import { useEffect, useState } from "react";

import type { EntrepriseType } from "./siren";

const KEY = "répartition-équilibrée-form";

const repartitionEquilibreeDefault: RepartitionEquilibreeForm = {
  declarant: {
    email: "",
    prenom: "",
    nom: "",
    telephone: "",
    accord_rgpd: undefined,
  },
  endOfPeriod: "",
  entreprise: {
    adresse: "",
    code_naf: "",
    code_pays: "",
    code_postal: "",
    commune: "",
    département: "",
    raison_sociale: "",
    région: "",
    siren: "",
  },
  year: undefined,
};

// TODO: add properties for the future pages
type RepartitionEquilibreeForm = {
  declarant: {
    accord_rgpd: boolean | undefined;
    email: string;
    nom: string;
    prenom: string;
    telephone: string;
  };
  endOfPeriod?: string;
  entreprise?: EntrepriseType;
  year?: number | undefined;
};

export const save = (data: Partial<RepartitionEquilibreeForm>) => {
  const actualForm = get();

  localStorage.setItem(KEY, JSON.stringify({ ...actualForm, ...data }));
};

export const get = () => {
  const data = localStorage.getItem(KEY);

  return data === null ? {} : JSON.parse(data);
};

export const destroy = () => {
  localStorage.removeItem(KEY);
};

export const useFormManager = () => {
  const [formData, setFormData] = useState<RepartitionEquilibreeForm>(repartitionEquilibreeDefault);

  const resetFormData = () => {
    destroy();
    setFormData(repartitionEquilibreeDefault);
  };

  // Get data from local storage on component's mount.
  useEffect(() => {
    setFormData(get());
  }, []);

  return { formData, saveFormData: save, resetFormData };
};
