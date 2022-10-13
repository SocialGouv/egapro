import { useEffect, useState } from "react";
import type { EntrepriseType } from "../services/apiClient/siren";

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

export const updateFormData = (data: Partial<RepartitionEquilibreeForm>) => {
  const actualForm = getFormData();

  localStorage.setItem(KEY, JSON.stringify({ ...actualForm, ...data }));
};

export const getFormData = () => {
  const data = localStorage.getItem(KEY);

  return data === null ? {} : JSON.parse(data);
};

export const destroyFormData = () => {
  localStorage.removeItem(KEY);
};

export const useFormManager = () => {
  const [formData, setFormData] = useState<RepartitionEquilibreeForm>(repartitionEquilibreeDefault);

  const resetFormData = () => {
    destroyFormData();
    setFormData(repartitionEquilibreeDefault);
  };

  // Get data from local storage on component's mount.
  useEffect(() => {
    setFormData(getFormData());
  }, []);

  return { formData, updateFormData, resetFormData, destroyFormData };
};
