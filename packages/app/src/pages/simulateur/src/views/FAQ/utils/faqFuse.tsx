import Fuse from "fuse.js"

import { faqData } from "../../../data/faq"

export const faqDataForFuse = Object.entries(faqData).reduce((acc, [part, { title, qr }]) => {
  const newQr = qr.map((datum, index) => ({ part, title, index, ...datum }))
  return acc.concat(newQr)
}, [] as any[])

const fuseOption = {
  shouldSort: true,
  includeScore: true,
  includeMatches: true,
  threshold: 0.3,
  tokenize: true,
  minMatchCharLength: 2,
  keys: ["question", "reponse"],
}

export default new Fuse(faqDataForFuse, fuseOption)
