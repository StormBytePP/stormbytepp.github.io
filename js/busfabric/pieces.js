const BF_N = 1;
const BF_E = 2;
const BF_S = 4;
const BF_W = 8;

function opposite(bit) {
	if (bit === BF_N) return BF_S;
	if (bit === BF_S) return BF_N;
	if (bit === BF_E) return BF_W;
	if (bit === BF_W) return BF_E;
	return 0;
}

function rotMask(mask, rot) {
	let m = mask & 15;
	const r = ((rot % 4) + 4) % 4;
	for (let i = 0; i < r; i++) {
		let n = 0;
		if (m & BF_N) n |= BF_E;
		if (m & BF_E) n |= BF_S;
		if (m & BF_S) n |= BF_W;
		if (m & BF_W) n |= BF_N;
		m = n;
	}
	return m;
}

function baseMask(type) {
	switch (type) {
		case "straight": return BF_N | BF_S;
		case "elbow":    return BF_N | BF_E;
		case "tee":      return BF_N | BF_E | BF_S;   // T pointing east
		case "cross":    return BF_N | BF_E | BF_S | BF_W;
		case "dead":     return BF_N;
		default:         return 0;
	}
}

function pieceMask(type, rot) {
	return rotMask(baseMask(type), rot | 0);
}

function bitFromDelta(dr, dc) {
	if (dr === -1 && dc === 0) return BF_N;
	if (dr ===  1 && dc === 0) return BF_S;
	if (dr ===  0 && dc === 1) return BF_E;
	if (dr ===  0 && dc ===-1) return BF_W;
	return 0;
}

function pieceForMask(need) {
	need = need & 15;
	const types = ["straight", "elbow"];
	for (let t = 0; t < types.length; t++) {
		for (let rot = 0; rot < 4; rot++) {
			if (pieceMask(types[t], rot) === need) {
				return { type: types[t], rot: rot };
			}
		}
	}
	return { type: "elbow", rot: 0 };
}

function pickPieceType() {
	const w = TRACE_GAME.pieceWeights || {};
	const entries = [
		["straight", w.straight != null ? w.straight : 0.30],
		["elbow",    w.elbow    != null ? w.elbow    : 0.30],
		["tee",      w.tee      != null ? w.tee      : 0.18],
		["cross",    w.cross    != null ? w.cross    : 0.10],
		["dead",     w.dead     != null ? w.dead     : 0.12],
	];
	let sum = 0;
	for (let i = 0; i < entries.length; i++) sum += entries[i][1];
	let r = Math.random() * sum;
	for (let i = 0; i < entries.length; i++) {
		r -= entries[i][1];
		if (r <= 0) return entries[i][0];
	}
	return "elbow";
}

function busPathD(type, rot, x, y, s) {
	const cx = x + s / 2;
	const cy = y + s / 2;
	const ports = {};
	ports[BF_N] = { x: cx,     y: y };
	ports[BF_E] = { x: x + s,  y: cy };
	ports[BF_S] = { x: cx,     y: y + s };
	ports[BF_W] = { x: x,      y: cy };

	const m = pieceMask(type, rot);
	const bits = [];
	if (m & BF_N) bits.push(BF_N);
	if (m & BF_E) bits.push(BF_E);
	if (m & BF_S) bits.push(BF_S);
	if (m & BF_W) bits.push(BF_W);

	if (!bits.length) return "";

	if (bits.length === 1) {
		const p = ports[bits[0]];
		return "M " + p.x + " " + p.y + " L " + cx + " " + cy;
	}

	if (bits.length === 2) {
		const a = ports[bits[0]];
		const b = ports[bits[1]];
		return "M " + a.x + " " + a.y + " L " + cx + " " + cy + " L " + b.x + " " + b.y;
	}

	/* tee / cross – star from centre */
	let d = "";
	for (let i = 0; i < bits.length; i++) {
		const p = ports[bits[i]];
		d += (i ? " " : "") + "M " + p.x + " " + p.y + " L " + cx + " " + cy;
	}
	return d;
}
