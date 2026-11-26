import type { ProbeNotification } from "./policy.js";

export type NotificationSender = {
	notify(notification: ProbeNotification): Promise<boolean>;
};

export type NotificationQueue = {
	/**
	 * Queues a notification for its probe and flushes that probe's pending
	 * queue in order. Never throws: an undelivered notification stays queued
	 * for the next run.
	 */
	enqueue(notification: ProbeNotification): Promise<void>;
};

/**
 * Per-probe FIFO of undelivered notifications.
 *
 * The policy only emits an alert on the exact threshold run, so dropping a
 * webhook failure would lose that alert forever while the recovery still goes
 * out. Keeping the failed notification and retrying it on every later run of
 * the same probe fixes both halves: the alert is eventually delivered, and the
 * recovery that follows it is delivered after it, in order.
 */
export function createNotificationQueue(
	sender: NotificationSender,
): NotificationQueue {
	const pending = new Map<string, ProbeNotification[]>();

	return {
		async enqueue(notification) {
			const queue = pending.get(notification.probe.key) ?? [];
			queue.push(notification);
			pending.set(notification.probe.key, queue);

			while (queue.length > 0) {
				const next = queue[0];
				if (!next) break;
				const delivered = await sender.notify(next);
				if (!delivered) return;
				queue.shift();
			}

			pending.delete(notification.probe.key);
		},
	};
}
