import { z } from "zod";
import { DECLARATION_FSM_STATUSES } from "~/modules/domain";

const JsonScalarSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.null(),
]);

const PredicateBaseSchema = z.union([
	z.object({
		fact: z.string(),
		op: z.enum(["==", "!=", ">", ">=", "<", "<="]),
		value: JsonScalarSchema,
	}),
	z.object({
		fact: z.string(),
		op: z.enum(["==", "!=", ">", ">=", "<", "<="]),
		threshold: z.string(),
	}),
	z.object({ fact: z.string(), op: z.literal("isNull") }),
	z.object({ fact: z.string(), op: z.literal("isNotNull") }),
	z.object({
		fact: z.string(),
		op: z.literal("in"),
		value: z.array(JsonScalarSchema),
	}),
	z.object({ compute: z.string() }),
]);

export type Predicate =
	| z.infer<typeof PredicateBaseSchema>
	| { all: Predicate[] }
	| { any: Predicate[] }
	| { not: Predicate };

export const PredicateSchema: z.ZodType<Predicate> = z.lazy(() =>
	z.union([
		PredicateBaseSchema,
		z.object({ all: z.array(PredicateSchema) }),
		z.object({ any: z.array(PredicateSchema) }),
		z.object({ not: PredicateSchema }),
	]),
);

export const EVENT_TYPES = [
	"submit",
	"path_choice",
	"second_declaration_submit",
	"joint_evaluation_submit",
	"cse_opinion_submit",
	"cancel",
	"demarche_complete",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EventSchema = z.object({
	type: z.enum(EVENT_TYPES),
	value: z.string().optional(),
	round: z.union([z.literal(1), z.literal(2)]).optional(),
});

export type RuleEvent = z.infer<typeof EventSchema>;

export const TransitionSchema = z.object({
	id: z.string(),
	from: z.array(z.enum(DECLARATION_FSM_STATUSES)).min(1),
	action: z.string(),
	matchPayload: z.record(z.string(), z.unknown()).optional(),
	guard: PredicateSchema.optional(),
	to: z.enum(DECLARATION_FSM_STATUSES),
	events: z.array(EventSchema),
});

export type Transition = z.infer<typeof TransitionSchema>;

export const StageSchema = z.object({
	id: z.number(),
	name: z.string(),
});

export const StateSchema = z.object({
	id: z.enum(DECLARATION_FSM_STATUSES),
	stage: z.number().nullable(),
	terminal: z.boolean().optional(),
});

export const ComputationNodeSchema: z.ZodType<unknown> = z.lazy(() =>
	z.union([
		z.object({
			fact: z.string(),
			op: z.enum(["==", "!=", ">", ">=", "<", "<="]),
			value: JsonScalarSchema,
		}),
		z.object({
			fact: z.string(),
			op: z.enum(["==", "!=", ">", ">=", "<", "<="]),
			threshold: z.string(),
		}),
		z.object({ fact: z.string(), op: z.literal("isNull") }),
		z.object({ fact: z.string(), op: z.literal("isNotNull") }),
		z.object({ all: z.array(ComputationNodeSchema) }),
		z.object({ any: z.array(ComputationNodeSchema) }),
		z.object({ not: ComputationNodeSchema }),
		z.object({ compute: z.string() }),
	]),
);

export const RulesSchema = z.object({
	version: z.string(),
	effectiveFrom: z.string().optional(),
	effectiveUntil: z.string().optional(),
	description: z.string().optional(),
	thresholds: z.record(z.string(), z.number()),
	stages: z.array(StageSchema).min(1),
	states: z.array(StateSchema).min(1),
	actions: z
		.array(
			z.object({
				id: z.string(),
				from: z.array(z.string()).min(1),
			}),
		)
		.optional(),
	computations: z.record(z.string(), ComputationNodeSchema).optional(),
	transitions: z.array(TransitionSchema),
});

export type Rules = z.infer<typeof RulesSchema>;
