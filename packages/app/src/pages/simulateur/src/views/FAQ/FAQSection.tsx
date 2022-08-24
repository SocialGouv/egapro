import React, { FunctionComponent } from "react"
import { Link } from "react-router-dom"
import { Box, List, ListItem, VStack, Button } from "@chakra-ui/react"

import { FAQSectionType } from "../../globals"
import FAQSearch from "./FAQSearch"
import FAQTitle from "./components/FAQTitle"
import FAQTitle2 from "./components/FAQTitle2"
import FAQQuestionRow from "./components/FAQQuestionRow"
import FAQEffectifsSteps from "./components-steps/FAQEffectifsSteps"
import FAQIndicateur1Steps from "./components-steps/FAQIndicateur1Steps"
import FAQIndicateur2Steps from "./components-steps/FAQIndicateur2Steps"
import FAQIndicateur3Steps from "./components-steps/FAQIndicateur3Steps"
import FAQIndicateur2et3Steps from "./components-steps/FAQIndicateur2et3Steps"
import FAQIndicateur4Steps from "./components-steps/FAQIndicateur4Steps"
import FAQIndicateur5Steps from "./components-steps/FAQIndicateur5Steps"
import FAQInformationsSteps from "./components-steps/FAQInformationsSteps"
import FAQResultatSteps from "./components-steps/FAQResultatSteps"

import { faqData, faqSections } from "../../data/faq"

interface FAQSectionProps {
  section: FAQSectionType
}

const FAQSection: FunctionComponent<FAQSectionProps> = ({ section }) => {
  const faqSection = faqSections[section]
  const FAQStepsElement = FAQSteps({ section })

  return (
    <React.Fragment>
      <FAQTitle mb={6}>{faqSection.title}</FAQTitle>
      <FAQSearch>
        <div>
          {FAQStepsElement && (
            <React.Fragment>
              <FAQTitle2 mb={3} as="h4">
                L'essentiel
              </FAQTitle2>
              <VStack spacing={4}>{FAQStepsElement}</VStack>
            </React.Fragment>
          )}
          {[
            "indicateur1",
            "indicateur2",
            "indicateur3",
            "indicateur2et3",
            "indicateur4",
            "indicateur5",
            "resultat",
          ].includes(section) && (
            <Box mt={4} ml={6}>
              <Button
                as={Link}
                to={{ state: { faq: `/section/${section}/detail-calcul` } }}
                size="sm"
                variant="outline"
                colorScheme="primary"
                width="100%"
              >
                Comment est calculé {section === "resultat" ? "l'index" : "l'indicateur"}&nbsp;?
              </Button>
            </Box>
          )}
          {faqSection.parts.length > 0 && (
            <Box mt={6}>
              <FAQTitle2 mb={3} as="h4">
                Les questions récurrentes
              </FAQTitle2>
              <List>
                {faqSection.parts.map((part) => {
                  const faqPart = faqData[part]
                  return faqPart.qr.map(({ question }, index) => (
                    <ListItem
                      key={part + index}
                      sx={{
                        "&:not(:first-of-type)": {
                          paddingTop: 2,
                        },
                        "&:not(:last-child)": {
                          paddingBottom: 2,
                          borderBottom: "1px solid var(--chakra-colors-gray-100)",
                        },
                      }}
                    >
                      <FAQQuestionRow part={part} index={index} question={question} />
                    </ListItem>
                  ))
                })}
              </List>
            </Box>
          )}
        </div>
      </FAQSearch>
    </React.Fragment>
  )
}

const FAQSteps: FunctionComponent<FAQSectionProps> = ({ section }) => {
  switch (section) {
    case "informations":
      return <FAQInformationsSteps />
    case "effectifs":
      return <FAQEffectifsSteps />
    case "indicateur1":
      return <FAQIndicateur1Steps />
    case "indicateur2":
      return <FAQIndicateur2Steps />
    case "indicateur3":
      return <FAQIndicateur3Steps />
    case "indicateur2et3":
      return <FAQIndicateur2et3Steps />
    case "indicateur4":
      return <FAQIndicateur4Steps />
    case "indicateur5":
      return <FAQIndicateur5Steps />
    case "resultat":
      return <FAQResultatSteps />
    default:
      return null
  }
}

export default FAQSection
