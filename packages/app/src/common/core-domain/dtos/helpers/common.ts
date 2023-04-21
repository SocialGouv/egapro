import { COUNTIES_IDS, REGIONS_IDS } from "@common/dict";
import { z } from "zod";

export const regionSchema = z.enum(REGIONS_IDS);
export const countySchema = z.enum(COUNTIES_IDS);
