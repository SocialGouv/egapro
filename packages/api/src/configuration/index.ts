import { config } from "dotenv";
import { getConfiguration } from "./configs";

config({ path: "./../../.env" });

//

export const configuration = getConfiguration(process.env);
