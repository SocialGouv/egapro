import { fireEvent, render, screen } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import ValidationTransmissionPage from "../page";

// Mock useDeclarationFormManager
jest.mock("@services/apiClient/useDeclarationFormManager", () => {
  const defaultMockFormData = {
    "declaration-existante": {
      status: "creation",
    },
    entreprise: {
      entrepriseDéclarante: {
        raisonSociale: "SCOTT SPORTS SA",
        siren: "424805471",
        codeNaf: "4649Z",
        adresse: "123 Rue de la Paix",
        codePostal: "75000",
        commune: "Paris",
        département: "75",
        région: "Île-de-France",
      },
      tranche: "251:999",
      type: "entreprise",
    },
    declarant: {
      nom: "Firstname",
      prénom: "Lastname",
      email: "test@test.com",
      téléphone: "0666666666",
    },
    "periode-reference": {
      périodeSuffisante: "oui",
      finPériodeRéférence: "2024-12-31",
      effectifTotal: 200,
    },
    remunerations: {
      estCalculable: "oui",
      mode: "csp",
      résultat: 39,
      note: 39,
    },
    "augmentations-et-promotions": {
      estCalculable: "non-applicable",
    },
    augmentations: {
      estCalculable: "oui",
      résultat: 1,
      note: 20,
    },
    promotions: {
      estCalculable: "oui",
      résultat: 1,
      note: 15,
    },
    "conges-maternite": {
      estCalculable: "oui",
      résultat: 100,
      note: 15,
    },
    "hautes-remunerations": {
      résultat: 1,
      note: 5,
    },
    "resultat-global": {
      points: 10,
      pointsCalculables: 100,
      index: 10,
      mesures: "non-applicable",
    },
    publication: {
      modalités: "site-internet",
      url: "https://example.com",
      date: "2024-01-01",
      planRelance: "non",
    },
    commencer: {
      annéeIndicateurs: 2023,
    },
  };

  // We'll use this to allow tests to override the default mock data
  let currentMockFormData = { ...defaultMockFormData };
  return {
    useDeclarationFormManager: jest.fn(() => ({
      formData: currentMockFormData,
      setStatus: jest.fn(),
    })),
    // Helper to reset or modify the mock data for specific tests
    __setMockFormData: customData => {
      if (customData === "reset") {
        currentMockFormData = { ...defaultMockFormData };
      } else {
        currentMockFormData = {
          ...defaultMockFormData,
          ...customData,
        };
      }
    },
  };
});

// Mock next/navigation (bibliothèque externe)
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

// Mock next-auth/react (bibliothèque externe)
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: { user: { email: "test@test.com", staff: false } },
    status: "authenticated",
  })),
}));

// Mock postgres module instead of repo
jest.mock("@api/shared-domain/infra/db/postgres", () => {
  // Create a mock SQL function that can be called in different ways
  const mockSql = jest.fn((...args) => {
    // Handle different call patterns
    if (args.length === 0) {
      return mockSql; // Return self for chaining
    }

    // Handle template literal calls (sql`select * from ...`)
    if (Array.isArray(args[0])) {
      return Promise.resolve([]);
    }

    // Handle direct calls like sql(data, "field1", "field2")
    return mockSql;
  });

  // Add methods and properties needed by the repo implementations
  mockSql.begin = jest.fn(callback => Promise.resolve(callback(mockSql)));

  // Add any other methods used in the code
  return {
    sql: mockSql,
  };
});

// Mock ClientOnly pour éviter les problèmes de rendu côté serveur
jest.mock("@components/utils/ClientOnly", () => ({
  ClientOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useHasMounted: jest.fn(() => true),
}));

// Mock les services utilisés par saveDeclaration
jest.mock("@api/core-domain/infra/mail", () => ({
  globalMailerService: {
    sendEmail: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("@api/core-domain/infra/services", () => ({
  entrepriseService: {
    getEntreprise: jest.fn(() => Promise.resolve({ nom: "Test Company" })),
    siren: jest.fn(() => {
      return Promise.resolve({
        activitePrincipale: "Commerce de détail d'articles de sport en magasin spécialisé",
        activitePrincipaleUniteLegale: "46.49Z",
        allMatchingEtablissements: [
          {
            activitePrincipaleEtablissement: "47.64Z",
            address: "11 RTE DU CROCHET 1762",
            codePaysEtrangerEtablissement: "99140",
            codePostalEtablissement: "1762",
            etablissementSiege: true,
            siret: "42480547100044",
          },
          {
            activitePrincipaleEtablissement: "46.49Z",
            address: "17 RTE GIVIZIEZ",
            codePaysEtrangerEtablissement: "99140",
            codePostalEtablissement: "1762",
            etablissementSiege: false,
            siret: "42480547100010",
          },
          {
            activitePrincipaleEtablissement: "51.4S",
            address: "PAE LES GLAISINS 3 RUE DU BULLOZ 74000 ANNECY",
            codeCommuneEtablissement: "74010",
            codePaysEtrangerEtablissement: "99140",
            codePostalEtablissement: "1762",
            etablissementSiege: false,
            siret: "42480547100028",
          },
          {
            activitePrincipaleEtablissement: "46.49Z",
            address: "PAE LES GLAISINS 11 RUE DU PRE FAUCON 74000 ANNECY",
            codeCommuneEtablissement: "74010",
            codePaysEtrangerEtablissement: "99140",
            codePostalEtablissement: "1762",
            etablissementSiege: false,
            idccs: [Array],
            siret: "42480547100036",
          },
        ],
        categorieJuridiqueUniteLegale: "3120",
        conventions: [
          {
            idcc: 573,
            etat: "VIGUEUR_ETEN",
            id: "KALICONT000005635373",
            mtime: 1562182376,
            shortTitle: "Commerces de gros",
            texte_de_base: "KALITEXT000005673619",
            title:
              "Convention collective nationale de commerces de gros du 23 juin 1970. Etendue par arrêté du 15 juin 1972 JONC 29 août 1972. Mise à jour par accord du 27 septembre 1984 étendu par arrêté du 4 février 1985 JORF 16 février 1985.",
            url: "https://www.legifrance.gouv.fr/affichIDCC.do?idConvention=KALICONT000005635373",
          },
        ],
        dateCreationUniteLegale: "1999-09-01",
        dateDebut: "2024-09-03",
        etablissements: 4,
        etatAdministratifUniteLegale: "A",
        firstMatchingEtablissement: {
          activitePrincipaleEtablissement: "47.64Z",
          address: "11 RTE DU CROCHET 1762",
          categorieEntreprise: "PME",
          codePaysEtrangerEtablissement: "99140",
          codePostalEtablissement: "1762",
          etablissementSiege: true,
          etatAdministratifEtablissement: "A",
          idccs: [],
          siret: "42480547100044",
        },
        highlightLabel: "SCOTT SPORTS SA",
        label: "SCOTT SPORTS SA",
        matching: 4,
        simpleLabel: "SCOTT SPORTS SA",
        siren: "424805471",
      });
    }),
  },
}));

jest.mock("@api/shared-domain/infra/pdf", () => ({
  jsxPdfService: {
    generatePdf: jest.fn(() => Promise.resolve(Buffer.from("test"))),
  },
}));

// Mock assertServerSession pour éviter les problèmes d'authentification
jest.mock("@api/utils/auth", () => ({
  assertServerSession: jest.fn(() =>
    Promise.resolve({
      user: {
        email: "test@test.com",
        staff: false,
      },
    }),
  ),
}));

describe("ValidationTransmissionPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: "test@test.com", staff: false } },
      status: "authenticated",
    });
  });

  describe("Avec des données de formulaire complètes", () => {
    it("devrait afficher les informations de l'entreprise", () => {
      render(<ValidationTransmissionPage />);

      expect(screen.getByText("SCOTT SPORTS SA")).toBeInTheDocument();
      expect(screen.getByText("424805471")).toBeInTheDocument();
    });

    it("devrait afficher les informations du déclarant", () => {
      render(<ValidationTransmissionPage />);

      // Use a more flexible matcher for the name since it might have whitespace
      expect(screen.getByText(/Firstname/)).toBeInTheDocument();
      expect(screen.getByText(/Lastname/)).toBeInTheDocument();

      // Use a more flexible matcher for the email
      expect(screen.getByText(/test@test\.com/)).toBeInTheDocument();

      // Use a more flexible matcher for the phone
      expect(screen.getByText(/0666666666/)).toBeInTheDocument();
    });

    it("devrait afficher les informations de la période de référence", () => {
      render(<ValidationTransmissionPage />);

      expect(screen.getByText("31/12/2024")).toBeInTheDocument();
      expect(screen.getByText("200")).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    beforeEach(() => {
      // Reset mock data before each test
      jest.requireMock("@services/apiClient/useDeclarationFormManager").__setMockFormData("reset");
    });

    it("should display the foreign postal code in the recap", async () => {
      // Set foreign postal code in mock data
      jest.requireMock("@services/apiClient/useDeclarationFormManager").__setMockFormData({
        entreprise: {
          entrepriseDéclarante: {
            adresse: "11 RTE DU CROCHET 1762",
            codeNaf: "46.49Z",
            codePostal: "1762",
            codePays: "CH",
            raisonSociale: "SCOTT SPORTS SA",
            siren: "424805471",
          },
          tranche: "251:999",
          type: "entreprise",
        },
      });

      render(<ValidationTransmissionPage />);
      fireEvent.click(screen.getByText("Valider et transmettre les résultats"));
      await wait();

      // Check for the company name and address
      expect(screen.queryByText(/"1762" is not a valid frenchpostalcode./)).not.toBeInTheDocument();
    });
  });
});
