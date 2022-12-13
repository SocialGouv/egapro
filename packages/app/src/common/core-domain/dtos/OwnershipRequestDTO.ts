export type OwnershipRequestSelectDTO = {
  askerEmail: string;
  createdAt: string;
  email: string;
  id: string;
  modifiedAt: string;
  siren: string;
  status: string;
};

export type OwnershipRequestCreateDTO = {
  askerEmail: string;
  email: string;
  siren: string;
  status: string;
};
