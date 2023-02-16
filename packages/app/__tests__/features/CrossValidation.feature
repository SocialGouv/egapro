Feature: Cross Validation Business Rules
    Scenario: Rule 1 - Declaration without missing fields
        Given a validated declaration
        When either a nafCode, or a declarant firstname, lastname, or phone is missing
        Then a declaration cannot be submitted

    # simulateur n'enverra jamais les indicateurs si la période est suffisante
    Scenario: Rule 2 - Not a sufficient period
        Given a validated declaration
        When declaration has not a sufficient period
        Then indicators should be set

    # 2021 est une année fixe pour les OP/MC
    Scenario: Rule 3 - OP/MC
        Given a validated declaration with sufficient period
        When declaration year is lower than 2021, or calculated index is greater or equal than 85
        Then progress objectives and corrective measures should not be set

    Scenario: Rule 4 - OP/MC OP valid date
        Given a validated declaration with sufficient period
        When progress objectives and corrective measures are set
        Then objectives publish date should be greater than reference period

    Scenario: Rule 5 - OP/MC MC valid date
        Given a validated declaration with sufficient period
        When progress objectives and corrective measures are set
        Then measures publish date should be greater than reference period

    Scenario: Rule 6 - Publish date, modalities, and url
        Given a validated declaration with sufficient period
        When declaration year is greater or equal than 2020, or index cannot be calculated
        Then publish date should be set
        And either publication modalities or publication url should set

    Scenario: Rule 7 - No corrective measures when no index
        Given a validated declaration with sufficient period
        When index cannot be calculated
        Then corrective measures should not be set

    Scenario: Rule 8 - No corrective measures when index >= 75
        Given a validated declaration with sufficient period
        When calculated index is greater or equal than 75
        Then corrective measures should not be set

    Scenario: Rule 9 - Mandatory corrective measures when index < 75
        Given a validated declaration with sufficient period
        When calculated index is lower than 75
        Then corrective measures should be set

    # L'année de la date de fin de période ne peut pas être différente de l'année au titre de laquelle les indicateurs sont calculés.
    Scenario: Rule 10 - Reference periode year
        Given a validated declaration with sufficient period
        When reference period year is not equal to declaration year
        Then a declaration cannot be submitted

    Scenario: Rule 11 - Company workforce range 50:250
        Given a validated declaration with sufficient period
        When the company workforce range is between 50 and 250
        Then salary raises (2), and promotions (3) indicators should not be set
        And salary raises and promotions (2&3) combined indicator should be set

    Scenario: Rule 12 - Company workforce other range than 50:250
        Given a validated declaration with sufficient period
        When the company workforce range not between 50 and 250
        Then salary raises (2), and promotions (3) indicators should be set
        And salary raises and promotions (2&3) combined indicator should not be set

    Scenario: Rule 13 - Mandatory recovery plan if >= 2021
        Given a validated declaration with sufficient period
        When declaration date is greater or equal than 2021
        Then company should answer if recovery plan has been given

    # should be defined from simulateur
    Scenario: Rule 14 - Indicator result not set when not computable
        Given any computable indicator in a declaration
        When this indicator cannot be computed
        Then no additional data should be set instead in this indicator

    # should be defined from simulateur
    Scenario: Rule 15 - Indicator result set when computable (exclude indicator 1)
        Given any computable indicator other than remunerations (1) in a declaration
        When this indicator can be computed
        Then this indicator result should be set

    # should be defined from simulateur
    Scenario: Rule 16 - Remuneration indicator result set when computable and favorable population
        Given a remunerations indicator (1) in a declaration
        When this indicator can be computed
        And this indicator has a favorable population
        Then this indicator result should be set

    Scenario: Rule 17 - Indicator 1, 2, and 3 with result at 0
        Given a remunerations (1), salary raises (2), or promotions (3) indicator in a declaration
        When this indicator result is equal to 0
        Then favorable population in this indicator should not be set

    Scenario: Rule 18 - UES Siren validation
        Given a declaration with UES
        When the UES has a company list
        Then no Siren in this UES should be duplicate
        And not invalid against Luhn algorithm

    # should be defined from simulateur
    Scenario: Rule 19 - No UES name if no sub company
        Given a declaration
        When no company list is set in a UES
        Then the UES name should not be set

    # should be defined from simulateur
    Scenario: Rule 20 - Remunerations CSE date in CSP when not computable
        Given a remunerations indicator (1) in a declaration
        When this indicator is not computable
        And this indicator mode is CSP
        Then the CSE consultation date should not be set

    Scenario: Rule 21 - Salary raises and promotions favorable population when results at 0
        Given a salary raises and promotions indicator (2&3) in a declaration
        When this indicator result is equal to 0
        And this indicator employees count result is also equal to 0
        Then this indicator favorable population should not be set

    Scenario: Rule 22 - High remunerations favorable population when result at 0
        Given a high remunerations indicator (4) in a declaration
        When this indicator result is equal to 5
        Then this indicator favorable population should not be set

    # ---

    Scenario: Extra Règle 1 - Date CSE obligatoire si entreprise avec CSE renseigné
        Given un indicateur de rémunéraration (1) avec une modalité de calcul autre que CSP
        When la structure est une entreprise
        And qu'un CSE est présent
        Then la date de consultation du CSE doit être obligatoirement ajoutée

    Scenario: Extra Règle 2 - Date CSE obligatoire si UES
        Given un indicateur de rémunéraration (1) avec une modalité de calcul autre que CSP
        When la structure est une UES
        Then la date de consultation du CSE doit être obligatoirement ajoutée

    Scenario: Extra Règle 3 - Pas d'OP/MC pour les indicateurs avec note max
        Given n'importe quel indicateur dans une déclaration validée avec une période suffisante
        When l'indicateur est non calculable ou que la note maximale est atteinte
        Then les OP/MC ne doivent pas être renseignés

    Scenario: Extra Règle 4 - Balance des notes entre les indicateurs 1 et 2, 3, ou 1 et 2&3
        Given une déclaration validée avec une période suffisante
        When la note obtenue à l'indicateur des rémunération (1) n'est pas maximale
        And que la population favorable des indicateurs 2, et 3, ou 2&3 (en fonction de la tranche) est inverse à la population favorable de l'indicateur 1
        Then la note obtenue à ces indicateurs 2, et 3, ou 2&3 (en fonction de la tranche) est quant à elle maximale


    # Skip car domaine groupé (User / déclarant / entreprise / ownership)
    Scenario: Déclarant/Entreprise Règle 1 - Mauvaises date de déclarations
        Given n'importe quelle déclaration
        When l'année de déclaration n'est pas renseignée, ou inférieure à 2018, ou supérieure à la dernière année d'ouverture des déclarations
        Then la déclaration ne peut être transmise

    Scenario: Déclarant/Entreprise Règle 2 - Siren de l'entreprise déclarante présent (UES ou non)
        Given n'importe quelle déclaration
        When le Siren de l'entreprise déclarante, qu'elle soit UES ou non n'est pas renseigné
        Then la déclaration ne peut être transmise

    Scenario: Déclarant/Entreprise Règle 3 - Siren de l'entreprise déclarante valide (UES ou non)
        Given n'importe quelle déclaration
        When le Siren de l'entreprise déclarante, qu'elle soit UES ou non est renseigné
        And correspond a une entreprise cessée, ou fermée avant le 1er Mars de l'année de déclaration
        Then la déclaration ne peut être transmise

    # Règles Decla directe
    Scenario Outline: DeclaDirecte Règle 1 - Indic 5 note
        Given un indicateur de hautes rémunérations (5)
        When le nombre de salariés du sexe sous-représenté est entre <min> et <max>
        Then la note obtenue est de <note>

        Examples:
            | min | max | note |
            | 4   | 5   | 10   |
            | 2   | 3   | 5    |
            | 0   | 1   | 0    |

    Scenario: DeclaDirecte Règle 2 - Indic 4 résultat 100%
        Given un indicateur de retour des congés maternité (4)
        When le résultat obtenu est égal à 100%
        Then la note obtenue est de 15 points

    Scenario: DeclaDirecte Règle 3 - Indic 4 résultat < 100%
        Given un indicateur de retour des congés maternité (4)
        When le résultat obtenu est inférieur à 100%
        Then la note obtenue est de 0 points

    Scenario: DeclaDirecte Règle X -
        Given
        When
        Then

    Scenario: DeclaDirecte Règle X -
        Given
        When
        Then

    Scenario: DeclaDirecte Règle X -
        Given
        When
        Then

    Scenario: DeclaDirecte Règle X -
        Given
        When
        Then

    Scenario: DeclaDirecte Règle X -
        Given
        When
        Then

    Scenario: DeclaDirecte Règle X -
        Given
        When
        Then

    Scenario: DeclaDirecte Règle X -
        Given
        When
        Then
