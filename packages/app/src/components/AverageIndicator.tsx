import { InfoOutlineIcon } from "@chakra-ui/icons";
import type { SelectProps } from "@chakra-ui/react";
import { Box, Center, Container, Select, Spinner, Stack, Text, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { capitalize } from "@common/utils/string";
import { buildUrlParamsString } from "@common/utils/url";
import type { UseStatsParams } from "@services/apiClient";
import { filterDepartements, useConfig, useStats } from "@services/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ButtonAction } from "./ds/ButtonAction";

export const FilterSelect = ({ name, onChange, value, children, ...rest }: SelectProps) => {
  const borderSelect = useColorModeValue("cyan.200", "cyan.100");
  const bgSelect = useColorModeValue("white", "blue.700");

  return (
    <Select name={name} onChange={onChange} value={value} borderColor={borderSelect} bgColor={bgSelect} {...rest}>
      {children}
    </Select>
  );
};

export const AverageIndicator = () => {
  const router = useRouter();
  const bgColor = useColorModeValue("blue.100", "blue.800");

  const { config } = useConfig();
  const { REGIONS_TRIES = [], SECTIONS_NAF_TRIES = [], PUBLIC_YEARS_TRIES = [], LAST_PUBLIC_YEAR = "" } = config ?? {};
  const [filters, setFilters] = useState<UseStatsParams>({});
  const [departements, setDepartements] = useState<ReturnType<typeof filterDepartements>>([]);
  const { stats, isLoading } = useStats(filters);

  const { year: _year, ...filtersWithoutYear } = filters;

  // Need to destructure and restructure to avoid TS error. Don't know why...
  const urlSearchParams = buildUrlParamsString({ ...filtersWithoutYear });

  useEffect(() => {
    setFilters({ year: LAST_PUBLIC_YEAR });
  }, [LAST_PUBLIC_YEAR]);

  useEffect(() => {
    // inital load of departments.
    setDepartements(filterDepartements(config));
  }, [config]); // config change only at start.

  const getAverage = () => (!stats ? "" : stats?.avg?.toFixed(0));

  const handleChange: SelectProps["onChange"] = event => {
    const { name, value } = event.currentTarget;

    let departement = getValue("departement");

    if (name === "region") {
      setDepartements(filterDepartements(config, value));
      departement = "";
    }
    setFilters({ ...filters, departement, [name]: value });
  };

  const getValue = (name: keyof UseStatsParams) => filters[name] || "";

  return (
    <Center bgColor={bgColor} w="100vw" py={8}>
      <Box textAlign="center">
        <Text fontFamily="cabin" fontSize="6xl" height="90px">
          {isLoading ? (
            <Spinner as="span" />
          ) : (
            getAverage() || (
              <Center>
                N/A
                <Tooltip label="Non applicable : il n'y pas assez de données pour les critères demandés">
                  <InfoOutlineIcon h="5" />
                </Tooltip>
              </Center>
            )
          )}
        </Text>
        <Text fontFamily="cabin" fontSize="2xl" fontWeight="bold" casing="capitalize">
          Index moyen{" "}
          {getValue("year")
            ? Number(getValue("year")) + 1
            : config?.LAST_PUBLIC_YEAR
            ? Number(config?.LAST_PUBLIC_YEAR) + 1
            : ""}
        </Text>
        <Container maxW="container.md">
          <Stack direction={["column", "row"]} mt={8}>
            <FilterSelect
              placeholder="Année de déclaration"
              name="year"
              onChange={handleChange}
              value={getValue("year")}
              aria-label="filtre sur l'année"
            >
              {PUBLIC_YEARS_TRIES.map(year => (
                <option key={year} value={String(year)}>
                  {year + 1}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              placeholder="Région"
              name="region"
              onChange={handleChange}
              value={getValue("region")}
              aria-label="filtre sur la région"
            >
              {REGIONS_TRIES.map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              placeholder="Département"
              name="departement"
              onChange={handleChange}
              value={getValue("departement")}
              aria-label="filtre sur le département"
            >
              {departements.map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              placeholder="Secteur d'activité"
              name="section_naf"
              onChange={handleChange}
              value={getValue("section_naf")}
              aria-label="filtre sur le secteur d'activité"
            >
              {SECTIONS_NAF_TRIES.map(([key, value]) => (
                <option key={key} value={key}>
                  {capitalize(value)}
                </option>
              ))}
            </FilterSelect>
          </Stack>
        </Container>

        <ButtonAction
          mt={8}
          label="Voir les entreprises"
          type="submit"
          onClick={() => router.push(`./consulter-index/recherche${urlSearchParams ? `?${urlSearchParams}` : ""}`)}
        />
      </Box>
    </Center>
  );
};
