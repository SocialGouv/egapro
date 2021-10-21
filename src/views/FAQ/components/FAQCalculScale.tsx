/** @jsx jsx */
import { css, jsx } from "@emotion/core"

interface Props {
  listTitle: string
  list: Array<string>
  scaleTitle: string
  scale: Array<string>
}

function FAQCalculScale({ listTitle, list, scaleTitle, scale }: Props) {
  return (
    <table css={styles.container}>
      <thead>
        <tr>
          <th css={[styles.text, styles.title]}>{listTitle}</th>
          <th css={[styles.text, styles.title]}>{scaleTitle}</th>
        </tr>
      </thead>
      <tbody>
        {list.map((listEl, index) => (
          <tr key={listEl}>
            <td css={styles.text}>• {listEl}</td>
            <td css={styles.text}>{scale[index]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const styles = {
  container: css({
    marginBottom: 12,
    padding: "13px 25px",
    backgroundColor: "#F9F7F9",
    borderRadius: 5,
    width: "100%",
  }),
  text: css({
    fontSize: 14,
    lineHeight: "17px",
  }),
  title: css({
    paddingBottom: 8,
    fontWeight: "bold",
    textAlign: "left",
  }),
}

export default FAQCalculScale
