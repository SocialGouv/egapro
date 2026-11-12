-- Align the representation campaign window with the domain rule: campaigns open
-- on 1 March and close on the last day of February of the following year, which
-- is also the last day a transmitted declaration stays modifiable. Rows written
-- before this rule carry 1 January → 31 December and would reopen the gap.
UPDATE "app_representation_campaign"
SET
	"campaign_start_date" = make_date("year", 3, 1),
	"campaign_end_date" = (make_date("year" + 1, 3, 1) - INTERVAL '1 day')::date;
