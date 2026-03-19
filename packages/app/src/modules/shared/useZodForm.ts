import { zodResolver } from "@hookform/resolvers/zod";
import { type FieldValues, type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

export function useZodForm<TOutput extends FieldValues>(
	schema: z.ZodType<TOutput, TOutput>,
	options?: Omit<UseFormProps<TOutput>, "resolver">,
) {
	return useForm<TOutput>({
		resolver: zodResolver(schema),
		...options,
	});
}
