import { describe, expect, it } from "vitest";

import { shouldDeliverByPreferences } from "../preferences";
import {
	DEFAULT_NOTIFICATION_PREFERENCES,
	NOTIFICATION_CATEGORY_BY_TYPE,
	NOTIFICATION_TYPES,
	type UserNotificationPreferences,
} from "../types";

describe("shouldDeliverByPreferences", () => {
	it("returns false when emailEnabled is off, regardless of category", () => {
		const prefs: UserNotificationPreferences = {
			emailEnabled: false,
			reminders: true,
			confirmations: true,
		};
		for (const type of NOTIFICATION_TYPES) {
			expect(shouldDeliverByPreferences(type, prefs)).toBe(false);
		}
	});

	it("respects the confirmations toggle independently", () => {
		const prefs: UserNotificationPreferences = {
			emailEnabled: true,
			reminders: true,
			confirmations: false,
		};
		expect(shouldDeliverByPreferences("declaration_submitted", prefs)).toBe(
			false,
		);
		expect(shouldDeliverByPreferences("campaign_opening", prefs)).toBe(true);
	});

	it("respects the reminders toggle independently", () => {
		const prefs: UserNotificationPreferences = {
			emailEnabled: true,
			reminders: false,
			confirmations: true,
		};
		expect(shouldDeliverByPreferences("annual_deadline_reminder", prefs)).toBe(
			false,
		);
		expect(shouldDeliverByPreferences("declaration_submitted", prefs)).toBe(
			true,
		);
	});

	it("default preferences deliver every notification type", () => {
		for (const type of NOTIFICATION_TYPES) {
			expect(
				shouldDeliverByPreferences(type, DEFAULT_NOTIFICATION_PREFERENCES),
			).toBe(true);
		}
	});
});

describe("NOTIFICATION_CATEGORY_BY_TYPE", () => {
	it("assigns a category to every notification type", () => {
		for (const type of NOTIFICATION_TYPES) {
			expect(NOTIFICATION_CATEGORY_BY_TYPE[type]).toBeDefined();
		}
	});

	it("classifies AR types as confirmations", () => {
		expect(NOTIFICATION_CATEGORY_BY_TYPE.declaration_submitted).toBe(
			"confirmations",
		);
		expect(NOTIFICATION_CATEGORY_BY_TYPE.second_declaration_submitted).toBe(
			"confirmations",
		);
		expect(NOTIFICATION_CATEGORY_BY_TYPE.cse_opinion_submitted).toBe(
			"confirmations",
		);
		expect(NOTIFICATION_CATEGORY_BY_TYPE.joint_evaluation_submitted).toBe(
			"confirmations",
		);
	});

	it("classifies reminder/opening types as reminders", () => {
		expect(NOTIFICATION_CATEGORY_BY_TYPE.campaign_opening).toBe("reminders");
		expect(NOTIFICATION_CATEGORY_BY_TYPE.second_declaration_reminder).toBe(
			"reminders",
		);
		expect(NOTIFICATION_CATEGORY_BY_TYPE.annual_deadline_reminder).toBe(
			"reminders",
		);
	});
});
