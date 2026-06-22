"use client";

import { useEffect, useRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export function useDraftAutoSave<TFieldValues extends FieldValues>(
	form: UseFormReturn<TFieldValues>,
	isReady: boolean,
	onChange: (values: TFieldValues) => void,
): void {
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	useEffect(() => {
		if (!isReady) return;
		const sub = form.watch((values) =>
			onChangeRef.current(values as TFieldValues),
		);
		return () => sub.unsubscribe();
	}, [isReady, form]);
}
