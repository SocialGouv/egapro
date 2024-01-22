/* eslint-disable react/forbid-component-props */
/* eslint-disable jsx-a11y/alt-text */
import { formatDateToFr } from "@common/utils/date";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import path from "path";

let initialized = false;
const logo = path.resolve("./public/logo.jpeg");

if (!initialized) {
  initialized = true;
  Font.registerHyphenationCallback(word => [word]);
  Font.register({
    family: "Marianne",
    fonts: [
      {
        src: path.resolve("./public/font/Marianne-Regular.ttf"),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: path.resolve("./public/font/Marianne-Bold.ttf"),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: path.resolve("./public/font/Marianne-RegularItalic.ttf"),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: path.resolve("./public/font/Marianne-BoldItalic.ttf"),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  });
}

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    fontFamily: "Marianne",
    padding: "9mm",
    paddingBottom: "23mm",
  },
  header: {
    fontSize: 15,
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 8,
  },
  logo: {
    maxWidth: "33mm",
    marginLeft: "-2.3mm",
  },
  title: {
    marginLeft: "2mm",
    fontWeight: "bold",
    marginRight: 18,
    display: "flex",
    flex: 1,
    lineHeight: 1.25,
  },
  body: {},
  footer: {
    position: "absolute",
    width: "100vw",
    textAlign: "center",
    fontStyle: "italic",
    bottom: "9mm",
    fontSize: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    borderBottom: "1px solid black",
    marginBottom: 8,
  },
  sectionRow: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    lineHeight: 1.75,
    alignItems: "center",
  },
  sectionRowKey: {
    fontWeight: "bold",
    maxWidth: "70%",
    lineHeight: 1.25,
  },
  sectionRowValue: {
    textAlign: "right",
    maxWidth: "70%",
  },
});

export interface BaseReceiptTemplateProps {
  declaredAt: Date;
  modifiedAt?: Date;
  siren: string;
  subject: string;
  table: [BaseReceiptTemplateProps.Table, ...BaseReceiptTemplateProps.Table[]];
  title: string;
  year: number;
}

export namespace BaseReceiptTemplateProps {
  export interface Table {
    rows: [Row, ...Row[]];
    title: string;
  }
  export interface Row {
    key: string;
    showAsBlock?: boolean;
    value?: number | string | null;
  }
}

const AUTHOR = "Egapro - Ministère du Travail";
const LANG = "fr";

export const BaseReceiptTemplate = ({
  declaredAt,
  siren,
  subject: partSubject,
  table,
  title: partTitle,
  year,
  modifiedAt,
}: BaseReceiptTemplateProps) => {
  const title = `${partTitle} ${siren}/${year}`;
  const subject = `${partSubject} pour l'année ${year + 1} au titre des données ${year}`;

  return (
    <Document title={title} subject={subject} author={AUTHOR} language={LANG} creator={AUTHOR} producer="Egapro">
      <Page style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Image style={styles.logo} source={logo} />
          <Text style={styles.title}>{subject}</Text>
        </View>
        <View style={styles.body}>
          {table.map((section, sectionIdx) => (
            <View key={`section-${sectionIdx}`} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.rows.map((row, rowIdx) =>
                row.showAsBlock ? (
                  <View key={`section-${sectionIdx}-row-${rowIdx}`} wrap={true}>
                    <Text style={styles.sectionRowKey}>{row.key}</Text>
                    <Text>{row.value ?? "-"}</Text>
                  </View>
                ) : (
                  <>
                    <View key={`section-${sectionIdx}-row-${rowIdx}`} style={styles.sectionRow}>
                      <Text style={styles.sectionRowKey}>{row.key}</Text>
                      <Text style={styles.sectionRowValue}>{row.value ?? "-"}</Text>
                    </View>
                  </>
                ),
              )}
            </View>
          ))}
        </View>
        <View style={styles.footer} fixed>
          <Text>
            Déclaration du {formatDateToFr(declaredAt)} pour le Siren {siren} et l'année {year}
          </Text>
          {modifiedAt && <Text>Dernière modification le {formatDateToFr(modifiedAt)}</Text>}
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
