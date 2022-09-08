Feature: Cross Validation Business Rules
    Background:
        Given a validated declaration

    Scenario Outline: Rule 1 - Declaration without missing fields
        When value <value> is missing
        Then an error <error> is thrown

        Examples:
            | value               | error                                                                                             |
            | company.nafCode     | Le code NAF de l'entreprise est obligatoire lorsque la déclaration n'est pas en brouillon         |
            | declarant.firstname | Le prénom du déclarant est obligatoire lorsque la déclaration n'est pas en brouillon              |
            | declarant.lastname  | Le nom de famille du déclarant est obligatoire lorsque la déclaration n'est pas en brouillon      |
            | declarant.phone     | Le numéro de téléphone du déclarant est obligatoire lorsque la déclaration n'est pas en brouillon |

    Scenario: Rule 2 - Reference periode
        Given a declaration with sufficient period at false
        When indicators are filled
        Then an error "La période de référence ne permet pas de définir des indicateurs." is thrown

    Scenario: Rule 3 -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 4 -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 5 -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 6 -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 7 -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 8 -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 9 -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 10 -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 11.a -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 11.b -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 12.a -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 12.b -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 13.a -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 13.b -
        Given TODO
        When TODO
        Then TODO

    Scenario: Rule 14 -
        Given TODO
        When TODO
        Then TODO
