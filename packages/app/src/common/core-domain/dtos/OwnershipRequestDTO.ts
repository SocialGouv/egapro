export type OwnershipRequestDTO = {
  askerEmail: string;
  createdAt: string;
  email?: string | undefined;
  id: string;
  modifiedAt: string;
  siren?: string | undefined;
  status: string;
};

export type GetOwnershipRequestDTO = {
  data: OwnershipRequestDTO[];
  params: {
    limit: number;
    offset: number;
    orderAsc: boolean;
    orderByColumn: string;
    siren?: string;
    status?: string;
  };
  totalCount: number;
  warnings?: Array<readonly [string, string]>;
};
