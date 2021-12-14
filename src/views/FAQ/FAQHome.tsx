import React from "react"
import { List, ListItem } from "@chakra-ui/react"

import { faqSections, faqData } from "../../data/faq"

import FAQSearch from "./FAQSearch"
import FAQSectionRow from "./components/FAQSectionRow"

const faqSectionsEntries = Object.entries(faqSections)

const FAQHome = () => (
  <FAQSearch>
    <List>
      {faqSectionsEntries.map(([faqKey, faqSection]) => {
        const questionsLength = faqSection.parts.reduce((acc, part) => acc + faqData[part].qr.length, 0)
        return (
          <ListItem
            key={faqKey}
            width="100%"
            sx={{
              "&:not(:first-of-type)": {
                paddingTop: 1,
              },
              "&:not(:last-child)": {
                paddingBottom: 1,
                borderBottom: "1px solid var(--chakra-colors-gray-100)",
              },
            }}
          >
            <FAQSectionRow
              section={faqKey}
              title={faqSection.title}
              detail={`${questionsLength + 1} article${questionsLength + 1 > 1 ? "s" : ""}`}
            />
          </ListItem>
        )
      })}
    </List>
  </FAQSearch>
)

export default FAQHome
