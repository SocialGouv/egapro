export type MailAttachment = {
	filename: string;
	content: Buffer;
	contentType: string;
};

export type ReceiptContext = {
	siren: string;
	year: number;
};
