import "server-only";

export type {
	EnqueueNotificationInput,
	EnqueueResult,
} from "./enqueue";
export { enqueueNotification } from "./enqueue";
export {
	getUserNotificationPreferences,
	shouldDeliverByPreferences,
	updateUserNotificationPreferences,
} from "./preferences";
export type { BuiltTemplate } from "./templates";
export { buildNotificationTemplate } from "./templates";
