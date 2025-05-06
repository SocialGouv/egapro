// Common mocks for representation-equilibree tests

// Mock data for French company
export const frenchCompanyMockData = {
  activitePrincipale: "Activités des sociétés holding",
  activitePrincipaleUniteLegale: "64.20Z",
  allMatchingEtablissements: [
    {
      activitePrincipaleEtablissement: "64.20Z",
      address: "LES 2 LIONS TECHNOPOLE BUSINESS POLE 2 72 AVENUE MARCEL DASSAULT 37200 TOURS",
      codeCommuneEtablissement: "37261",
      codePostalEtablissement: "37200",
      etablissementSiege: true,
      idccs: [1413],
      libelleCommuneEtablissement: "TOURS",
      siret: "38496450800111",
    },
  ],
  categorieJuridiqueUniteLegale: "5499",
  conventions: [
    {
      idcc: 1413,
    },
  ],
  dateCreationUniteLegale: "1992-03-02",
  dateDebut: "2015-11-19",
  etablissements: 11,
  etatAdministratifUniteLegale: "A",
  firstMatchingEtablissement: {
    activitePrincipaleEtablissement: "64.20Z",
    address: "LES 2 LIONS TECHNOPOLE BUSINESS POLE 2 72 AVENUE MARCEL DASSAULT 37200 TOURS",
    categorieEntreprise: "ETI",
    codeCommuneEtablissement: "37261",
    codePostalEtablissement: "37200",
    etablissementSiege: true,
    etatAdministratifEtablissement: "A",
    idccs: [1413],
    libelleCommuneEtablissement: "TOURS",
    siret: "38496450800111",
  },
  highlightLabel: "ARTUS FRANCE",
  label: "ARTUS FRANCE",
  matching: 11,
  simpleLabel: "ARTUS FRANCE",
  siren: "384964508",
};

// Mock data for foreign company
export const foreignCompanyMockData = {
  activitePrincipale: "Activités des sièges sociaux",
  activitePrincipaleUniteLegale: "46.18Z",
  allMatchingEtablissements: [
    {
      activitePrincipaleEtablissement: "70.10Z",
      codePaysEtrangerEtablissement: "99109",
      etablissementSiege: true,
      siret: "82070904600016",
    },
  ],
  categorieJuridiqueUniteLegale: "3120",
  conventions: [],
  dateCreationUniteLegale: "2016-05-18",
  dateDebut: "2022-02-16",
  etablissements: 159,
  etatAdministratifUniteLegale: "A",
  firstMatchingEtablissement: {
    activitePrincipaleEtablissement: "70.10Z",
    categorieEntreprise: "PME",
    codePaysEtrangerEtablissement: "99109",
    etablissementSiege: true,
    etatAdministratifEtablissement: "A",
    idccs: [],
    siret: "82070904600016",
  },
  highlightLabel: "AUDIBENE GMBH",
  label: "AUDIBENE GMBH",
  matching: 159,
  simpleLabel: "AUDIBENE GMBH",
  siren: "820709046",
};

// Mock data for French company funnel state
export const frenchCompanyFunnelState = {
  funnel: {
    year: 2024,
    siren: "351630371",
    lastname: "Egapro",
    firstname: "Test",
    phoneNumber: "0666666666",
    gdpr: true,
    email: "egapro-e2e@fabrique.social.gouv.fr",
    endOfPeriod: "2024-12-31",
    notComputableReasonExecutives: "aucun_cadre_dirigeant",
    notComputableReasonMembers: "aucune_instance_dirigeante",
  },
  isEdit: false,
  _hasHydrated: true,
  setIsEdit: jest.fn(),
  saveFunnel: jest.fn(),
  resetFunnel: jest.fn(),
};

// Mock data for foreign company funnel state
export const foreignCompanyFunnelState = {
  funnel: {
    siren: "820709046",
    year: 2022,
    lastname: "Egapro",
    firstname: "Test",
    phoneNumber: "0666666666",
    gdpr: true,
    email: "egapro-e2e@fabrique.social.gouv.fr",
    endOfPeriod: "2024-12-31",
    notComputableReasonExecutives: "aucun_cadre_dirigeant",
    notComputableReasonMembers: "aucune_instance_dirigeante",
  },
  isEdit: false,
  _hasHydrated: true,
  setIsEdit: jest.fn(),
  saveFunnel: jest.fn(),
  resetFunnel: jest.fn(),
};

// Options interface for setup functions
export interface SetupOptions {
  isForeignCompany?: boolean;
}

// Helper function to setup company mock
export const setupCompanyMock = (mock: jest.Mock, options: SetupOptions = {}) => {
  const { isForeignCompany = false } = options;
  mock.mockImplementation(async () => ({
    ok: true,
    data: isForeignCompany ? foreignCompanyMockData : frenchCompanyMockData,
  }));
};

// Helper function to setup funnel store mock
export const setupFunnelStoreMock = (mock: jest.Mock, options: SetupOptions = {}) => {
  const { isForeignCompany = false } = options;
  mock.mockImplementation(selector => {
    const state = isForeignCompany ? foreignCompanyFunnelState : frenchCompanyFunnelState;
    return selector ? selector(state) : state;
  });
};

// Common mock implementations
export const nextAuthReactMock = {
  useSession: jest.fn(() => ({
    data: {
      user: {
        staff: false,
        companies: [
          {
            label: "test",
            siren: "123456789",
          },
        ],
        email: "test@test.com",
      },
      expires: "",
    },
    status: "authenticated",
  })),
};

export const nextAuthMock = {
  getServerSession: jest.fn(async () => ({
    expires: "",
    staff: {
      impersonating: false,
    },
    user: {
      companies: [
        {
          label: "test",
          siren: "123456789",
        },
      ],
      companiesHash: "",
      email: "test@test.com",
      staff: true,
      tokenApiV1: "",
    },
  })),
};

export const repeqFunnelStoreMock = {
  useRepeqFunnelStore: jest.fn((selector?: (state: unknown) => unknown) => {
    // Simuler le comportement de Zustand qui appelle le sélecteur avec l'état
    const state = {
      funnel: { siren: "123456789", year: 2022 },
      isEdit: false,
      _hasHydrated: true,
      setIsEdit: jest.fn(),
      saveFunnel: jest.fn(),
      resetFunnel: jest.fn(),
    };
    // Si un sélecteur est fourni, l'appliquer, sinon retourner tout l'état
    return selector ? selector(state) : state;
  }),
  useRepeqFunnelStoreHasHydrated: jest.fn(() => true),
};
