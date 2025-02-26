describe("Page de login avec EMAIL_LOGIN=false", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    cy.clearLocalStorage();
    cy.clearCookies();

    // Intercepter les appels à next-auth pour simuler un utilisateur non connecté
    cy.intercept("GET", "/api/auth/session", {
      statusCode: 200,
      body: null,
    }).as("getSession");

    // Intercepter la requête qui vérifie si EMAIL_LOGIN est activé
    cy.intercept("GET", "/api/**", req => {
      if (req.url.includes("config") || req.url.includes("settings")) {
        req.reply(res => {
          if (res.body) {
            // Forcer EMAIL_LOGIN à false dans toutes les réponses d'API
            if (typeof res.body === "object") {
              // Parcourir récursivement l'objet pour trouver et modifier isEmailLogin
              const modifyIsEmailLogin = obj => {
                for (const key in obj) {
                  if (key === "isEmailLogin") {
                    obj[key] = false;
                  } else if (typeof obj[key] === "object" && obj[key] !== null) {
                    modifyIsEmailLogin(obj[key]);
                  }
                }
              };
              modifyIsEmailLogin(res.body);
            }
          }
        });
      }
    });

    // Visiter la page de login
    cy.visit("/login");
    cy.wait("@getSession");
  });

  it("Redirige vers MonComptePro lors du clic sur le bouton ProConnect", () => {
    // Intercepter la redirection vers MonComptePro
    cy.intercept("POST", "/api/auth/signin/moncomptepro", {
      statusCode: 302,
      headers: {
        Location: "/api/auth/callback/moncomptepro?code=test_code&state=test_state",
      },
    }).as("moncompteproSignin");

    // Cliquer sur le bouton ProConnect
    cy.get(".fr-connect").click();

    // Vérifier que la redirection vers MonComptePro a été interceptée
    cy.wait("@moncompteproSignin");
  });

  it("Gère correctement les erreurs d'authentification", () => {
    // Visiter la page de login avec une erreur
    cy.visit("/login?error=OAuthSignin");

    // Vérifier que le message d'erreur est affiché
    cy.contains("Erreur de connexion").should("be.visible");
    cy.contains("Essayez de vous connecter avec un compte différent.").should("be.visible");
  });

  it("Affiche un message de succès lorsque l'utilisateur est déjà connecté", () => {
    // Intercepter les appels à next-auth pour simuler un utilisateur connecté
    cy.intercept("GET", "/api/auth/session", {
      statusCode: 200,
      body: {
        user: {
          email: "test@example.com",
          companies: [{ label: "Entreprise Test", siren: "123456789" }],
          staff: false,
          tokenApiV1: "fake_token",
        },
        staff: {
          impersonating: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    }).as("getSessionLoggedIn");

    // Visiter la page de login
    cy.visit("/login");
    cy.wait("@getSessionLoggedIn");

    // Vérifier que le message de succès est affiché
    cy.contains("test@example.com").should("be.visible");
  });
});
