import Script from "next/script";

type Props = {
	nonce: string | undefined;
	year: number | undefined;
};

export function CampaignYearInitScript({ nonce, year }: Props) {
	if (year === undefined) return null;

	return (
		<Script id="campaign-year-init" nonce={nonce} strategy="beforeInteractive">
			{`window.__egaproCampaignYear=${year};`}
		</Script>
	);
}
