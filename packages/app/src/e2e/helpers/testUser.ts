import { readFileSync } from "node:fs";
import { TEST_USER_EMAIL_FILE } from "../constants";

export function getTestUserEmail(): string {
	return readFileSync(TEST_USER_EMAIL_FILE, "utf8").trim();
}
