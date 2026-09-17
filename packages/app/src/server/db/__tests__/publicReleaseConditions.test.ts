import { alias, PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { REPRESENTATION_CAMPAIGN_YEAR_OFFSET } from "~/modules/domain";

import {
	publiclyReleasedCampaignCondition,
	releasedRepresentationCampaignJoin,
} from "../publicReleaseConditions";
import { campaignDeadlines } from "../schema";

const dialect = new PgDialect({ casing: "snake_case" });

describe("publiclyReleasedCampaignCondition", () => {
	it("compares the release date against the Europe/Paris civil date (mirror of isYearPubliclyReleased)", () => {
		const { sql } = dialect.sqlToQuery(publiclyReleasedCampaignCondition());

		expect(sql).toContain("public_data_release_date");
		expect(sql.toLowerCase()).toContain("is not null");
		expect(sql.toLowerCase()).toContain("at time zone 'europe/paris'");
		expect(sql).toContain("::date");
		expect(sql.toLowerCase()).not.toContain("current_date");
	});

	it("accepts an aliased campaign table so a correlated subquery can reuse it", () => {
		const c2 = alias(campaignDeadlines, "c2");

		const { sql } = dialect.sqlToQuery(publiclyReleasedCampaignCondition(c2));

		expect(sql).toContain('"c2"."public_data_release_date"');
	});
});

describe("releasedRepresentationCampaignJoin", () => {
	it("offsets the reference year by the shared representation campaign-year constant", () => {
		const { sql, params } = dialect.sqlToQuery(
			releasedRepresentationCampaignJoin(),
		);

		expect(sql).toContain("year");
		expect(params).toContain(REPRESENTATION_CAMPAIGN_YEAR_OFFSET);
	});
});
