Feature: Cross Validation Business Rules
    Scenario: Rule 1 - Declaration without missing fields
        Given a validated declaration
        When either a nafCode, or a declarant firstname, lastname, or phone is missing
        Then a declaration cannot be submitted

    Scenario: Rule 2 - Not a sufficient period
        Given a validated declaration
        When declaration has not a sufficient period
        Then indicators should be set

    Scenario: Rule 3 - OP/MC
        Given a validated declaration with sufficient period
        When declaration year is lower than 2021, or calculated index is greater or equal than 85
        Then progress objectives and corrective measures should not be set

    Scenario: Rule 4 - OP/MC OP valid date
        Given a validated declaration with sufficient period
        When progress objectives and corrective measures are set
        Then objectives publish date should not be greater than reference period

    Scenario: Rule 5 - OP/MC MC valid date
        Given a validated declaration with sufficient period
        When progress objectives and corrective measures are set
        Then measures publish date should not be greater than reference period

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
        Then company recovery plan should be set

    Scenario: Rule 14 - Indicator result not set when not computable
        Given any computable indicator in a declaration
        When this indicator cannot be computed
        Then no additional data should be set instead in this indicator

    Scenario: Rule 15 - Indicator result set when computable (exclude indicator 1)
        Given any computable indicator other than remunerations (1) in a declaration
        When this indicator can be computed
        Then this indicator result should be set

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
        Given a declaration
        When an UES is set with a company list
        Then no Siren in this UES should be duplicate nor invalid against Luhn algorithm

    Scenario: Rule 19 - No UES name if no sub company
        Given a declaration
        When no company list is set in a UES
        Then the UES name should not be set

    Scenario: Rule 20 - Remunerations CSE date in CSP when not computable
        Given a remunerations indicator (1) in a declaration
        When this indicator is not computable
        And this indicator mode its mode is CSP
        Then the CSE consultation date should not be set

    Scenario: Rule 21 - Salary raises and promotions favorable population when results at 0
        Given a salary raises and promotions indicator (2&3) in a declaration
        When this indicator result is equal to 0
        And this indicator employees count result is also equal to 0
        Then this indicator favorable population should not be set

    Scenario: Rule 22 - High remunerations favorable population when result at 0
        Given a hight remunerations indicator (4) in a declaration
        When this indicator result is equal to 5
        Then this indicator favorable population should not be set
