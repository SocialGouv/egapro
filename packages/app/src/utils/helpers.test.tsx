import {
  calendarYear,
  displaySexeSurRepresente,
  messageEcartNombreEquivalentSalaries,
  Year
} from "./helpers";

describe("calendarYear", () => {
  test("adds a year", () => {
    expect(calendarYear("2018-12-31", Year.Add, 1)).toEqual("2019-12-30");
    expect(calendarYear("2019-01-01", Year.Add, 1)).toEqual("2019-12-31");
    expect(calendarYear("2019-01-02", Year.Add, 1)).toEqual("2020-01-01");
  });

  test("subtracts a year", () => {
    expect(calendarYear("2018-12-30", Year.Subtract, 1)).toEqual("2017-12-31");
    expect(calendarYear("2018-12-31", Year.Subtract, 1)).toEqual("2018-01-01");
    expect(calendarYear("2019-01-01", Year.Subtract, 1)).toEqual("2018-01-02");
  });

  test("adds more than one year", () => {
    expect(calendarYear("2018-12-31", Year.Add, 2)).toEqual("2020-12-30");
    expect(calendarYear("2019-01-01", Year.Add, 2)).toEqual("2020-12-31");
    expect(calendarYear("2019-01-02", Year.Add, 2)).toEqual("2021-01-01");
  });

  test("subtracts more than one year", () => {
    expect(calendarYear("2018-12-30", Year.Subtract, 2)).toEqual("2016-12-31");
    expect(calendarYear("2018-12-31", Year.Subtract, 2)).toEqual("2017-01-01");
    expect(calendarYear("2019-01-01", Year.Subtract, 2)).toEqual("2017-01-02");
  });
});

describe("displaySexeSurRepresente", () => {
  test("displays for 'hommes'", () => {
    expect(displaySexeSurRepresente("hommes")).toEqual(
      "écart favorable aux hommes"
    );
  });

  test("displays for 'femmes'", () => {
    expect(displaySexeSurRepresente("femmes")).toEqual(
      "écart favorable aux femmes"
    );
  });

  test("displays for undefined", () => {
    expect(displaySexeSurRepresente(undefined)).toEqual(
      "les hommes et les femmes sont à égalité"
    );
  });
});

describe("messageEcartNombreEquivalentSalaries", () => {
  describe("as many men as women in the company", () => {
    test("no favorites", () => {
      expect(
        messageEcartNombreEquivalentSalaries(undefined, undefined)
      ).toEqual("");
    });
    test("women favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("femmes", undefined)).toEqual(
        "Si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
      );
    });
    test("men favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("hommes", undefined)).toEqual(
        "Si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
      );
    });
  });

  describe("more men than women in the company", () => {
    test("no favorites", () => {
      expect(messageEcartNombreEquivalentSalaries(undefined, "femmes")).toEqual(
        ""
      );
    });
    test("women favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("femmes", "femmes")).toEqual(
        "Si ce nombre de femmes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes."
      );
    });
    test("men favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("hommes", "femmes")).toEqual(
        "Si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
      );
    });
  });

  describe("more women than men in the company", () => {
    test("no favorites", () => {
      expect(messageEcartNombreEquivalentSalaries(undefined, "hommes")).toEqual(
        ""
      );
    });
    test("women favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("femmes", "hommes")).toEqual(
        "Si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
      );
    });
    test("men favorited", () => {
      expect(messageEcartNombreEquivalentSalaries("hommes", "hommes")).toEqual(
        "Si ce nombre d'hommes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes."
      );
    });
  });
});
