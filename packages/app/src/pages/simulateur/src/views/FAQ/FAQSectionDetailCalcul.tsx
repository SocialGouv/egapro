import React, { FunctionComponent } from "react"
import { RouteComponentProps } from "react-router-dom"

import { FAQSectionType } from "../../globals"

import FAQTitle from "./components/FAQTitle"
import FAQTitle2 from "./components/FAQTitle2"
import FAQIndicateur1DetailCalcul from "./components-detail-calcul/FAQIndicateur1DetailCalcul"
import FAQIndicateur2DetailCalcul from "./components-detail-calcul/FAQIndicateur2DetailCalcul"
import FAQIndicateur3DetailCalcul from "./components-detail-calcul/FAQIndicateur3DetailCalcul"
import FAQIndicateur2et3DetailCalcul from "./components-detail-calcul/FAQIndicateur2et3DetailCalcul"
import FAQIndicateur4DetailCalcul from "./components-detail-calcul/FAQIndicateur4DetailCalcul"
import FAQIndicateur5DetailCalcul from "./components-detail-calcul/FAQIndicateur5DetailCalcul"
import FAQResultatDetailCalcul from "./components-detail-calcul/FAQResultatDetailCalcul"

import { faqSections } from "../../data/faq"

interface FAQSectionDetailCalculProps {
  section: FAQSectionType
  history: RouteComponentProps["history"]
}

const FAQSectionDetailCalcul: FunctionComponent<FAQSectionDetailCalculProps> = ({
  section,
}: FAQSectionDetailCalculProps) => {
  const faqSection = faqSections[section]
  const FAQDetailCalculElement = FAQDetailCalcul({ section })

  return (
    <React.Fragment>
      <FAQTitle mb={6}>{faqSection.title}</FAQTitle>

      {FAQDetailCalculElement && (
        <React.Fragment>
          <FAQTitle2 as="h4">
            Comprendre comment est calculé {section === "resultat" ? "l'index" : "l'indicateur"}
          </FAQTitle2>
          {FAQDetailCalculElement}
        </React.Fragment>
      )}
    </React.Fragment>
  )
}

const FAQDetailCalcul = ({ section }: { section: FAQSectionType }) => {
  switch (section) {
    case "indicateur1":
      return <FAQIndicateur1DetailCalcul />
    case "indicateur2":
      return <FAQIndicateur2DetailCalcul />
    case "indicateur3":
      return <FAQIndicateur3DetailCalcul />
    case "indicateur2et3":
      return <FAQIndicateur2et3DetailCalcul />
    case "indicateur4":
      return <FAQIndicateur4DetailCalcul />
    case "indicateur5":
      return <FAQIndicateur5DetailCalcul />
    case "resultat":
      return <FAQResultatDetailCalcul />
    default:
      return null
  }
}

export default FAQSectionDetailCalcul
