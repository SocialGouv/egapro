// Largest remainder method: the parts always sum back to `total` exactly, which
// independent rounding of each bucket cannot guarantee.
export function distributeByLargestRemainder(
	total: number,
	weights: number[],
): number[] {
	const n = weights.length;
	if (total <= 0) return new Array(n).fill(0) as number[];
	const positive = weights.some((w) => w > 0) ? weights : new Array(n).fill(1);
	const sum = positive.reduce((a, b) => a + b, 0);
	const raw = positive.map((w) => (total * w) / sum);
	const result = raw.map(Math.floor);
	let remaining = total - result.reduce((a, b) => a + b, 0);
	const order = raw
		.map((r, i) => ({ i, frac: r - Math.floor(r) }))
		.sort((a, b) => b.frac - a.frac);
	let k = 0;
	while (remaining > 0) {
		const slot = order[k % n];
		if (slot) result[slot.i] = (result[slot.i] ?? 0) + 1;
		remaining -= 1;
		k += 1;
	}
	return result;
}

export function proportionWomen(women: number, men: number): number {
	return women + men > 0 ? women / (women + men) : 0;
}

export function proportionMen(women: number, men: number): number {
	return women + men > 0 ? men / (women + men) : 0;
}

export function fmt2(n: number): string {
	return n.toFixed(2).replace(".", ",");
}

export function fmt4(n: number): string {
	return n.toFixed(4).replace(".", ",");
}
