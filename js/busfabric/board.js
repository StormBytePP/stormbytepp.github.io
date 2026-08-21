/**
 * Board generation (interesting non-straight paths) +
 * free mask-based stepping (packet always follows piece geometry).
 */

function bfKey(r, c) {
	return r + "," + c;
}

function bfNeighbors(r, c, n) {
	const out = [];
	if (r > 0)     out.push({ r: r - 1, c: c,     bit: BF_N });
	if (r < n - 1) out.push({ r: r + 1, c: c,     bit: BF_S });
	if (c > 0)     out.push({ r: r,     c: c - 1, bit: BF_W });
	if (c < n - 1) out.push({ r: r,     c: c + 1, bit: BF_E });
	return out;
}

function bfEdges(n) {
	const cells = { N: [], E: [], S: [], W: [] };
	for (let c = 0; c < n; c++) {
		cells.N.push({ r: 0,     c: c, edge: "N", inBit: BF_N });
		cells.S.push({ r: n - 1, c: c, edge: "S", inBit: BF_S });
	}
	for (let r = 0; r < n; r++) {
		cells.E.push({ r: r, c: n - 1, edge: "E", inBit: BF_E });
		cells.W.push({ r: r, c: 0,     edge: "W", inBit: BF_W });
	}
	return cells;
}

function bfPickPorts(n) {
	const edges = ["N", "E", "S", "W"];
	const eA = edges[(Math.random() * 4) | 0];
	let eB = edges[(Math.random() * 4) | 0];
	while (eB === eA) eB = edges[(Math.random() * 4) | 0];
	const all = bfEdges(n);
	const A = all[eA][(Math.random() * all[eA].length) | 0];
	const B = all[eB][(Math.random() * all[eB].length) | 0];
	return { A: A, B: B };
}

function bfStraightPath(n, A, B) {
	const path = [];
	let r = A.r, c = A.c;
	path.push({ r: r, c: c });
	while (c !== B.c) {
		c += c < B.c ? 1 : -1;
		path.push({ r: r, c: c });
	}
	while (r !== B.r) {
		r += r < B.r ? 1 : -1;
		path.push({ r: r, c: c });
	}
	return path;
}

function bfCountTurns(path) {
	if (path.length < 3) return 0;
	let turns = 0;
	for (let i = 1; i < path.length - 1; i++) {
		const dr1 = path[i].r - path[i - 1].r;
		const dc1 = path[i].c - path[i - 1].c;
		const dr2 = path[i + 1].r - path[i].r;
		const dc2 = path[i + 1].c - path[i].c;
		if (dr1 !== dr2 || dc1 !== dc2) turns++;
	}
	return turns;
}

function bfPathSpan(path) {
	let minR = 99, maxR = -1, minC = 99, maxC = -1;
	for (let i = 0; i < path.length; i++) {
		const p = path[i];
		if (p.r < minR) minR = p.r;
		if (p.r > maxR) maxR = p.r;
		if (p.c < minC) minC = p.c;
		if (p.c > maxC) maxC = p.c;
	}
	return {
		rows: maxR - minR + 1,
		cols: maxC - minC + 1,
	};
}

function bfCarvePath(n, A, B) {
	const key = bfKey;
	const path = [{ r: A.r, c: A.c }];
	const visited = {};
	visited[key(A.r, A.c)] = true;
	let guard = 0;

	while (
		(path[path.length - 1].r !== B.r || path[path.length - 1].c !== B.c) &&
		guard < n * n * 10
	) {
		guard++;
		const cur = path[path.length - 1];
		const opts = bfNeighbors(cur.r, cur.c, n).filter(function (nb) {
			return !visited[key(nb.r, nb.c)];
		});

		opts.sort(function (a, b) {
			const da = Math.abs(a.r - B.r) + Math.abs(a.c - B.c);
			const db = Math.abs(b.r - B.r) + Math.abs(b.c - B.c);
			const j = TRACE_GAME.pathJitter ? Math.random() * 1.2 : 0;
			return da + j - (db + (TRACE_GAME.pathJitter ? Math.random() * 1.2 : 0));
		});

		if (!opts.length) {
			if (path.length <= 1) break;
			path.pop();
			continue;
		}
		const pick = opts[0];
		visited[key(pick.r, pick.c)] = true;
		path.push({ r: pick.r, c: pick.c });
	}

	if (path[path.length - 1].r !== B.r || path[path.length - 1].c !== B.c) {
		return bfStraightPath(n, A, B);
	}
	return path;
}

function bfCarvePathFair(n, A, B) {
	const minLen   = TRACE_GAME.minPathLength || 14;
	const minTurns = TRACE_GAME.minTurns || 6;
	const minSpan  = TRACE_GAME.minSpan || 5;
	const attempts = TRACE_GAME.maxPathAttempts || 150;
	let best = null;
	let bestScore = -1;

	for (let attempt = 0; attempt < attempts; attempt++) {
		const path = bfCarvePath(n, A, B);
		const turns = bfCountTurns(path);
		const span  = bfPathSpan(path);

		/* hard reject almost-straight paths */
		if (path.length < minLen) continue;
		if (turns < minTurns) continue;
		if (span.rows < minSpan || span.cols < minSpan) continue;

		/* prefer longer + more turns */
		const score = path.length * 2 + turns * 5 + span.rows + span.cols;
		if (score > bestScore) {
			best = path;
			bestScore = score;
		}

		/* good enough – take it */
		if (turns >= minTurns + 1 && path.length >= minLen + 2) {
			return path;
		}
	}

	/* if we found at least one acceptable path, use the best */
	if (best) return best;

	/* absolute last resort – still try to force some turns */
	let fallback = bfStraightPath(n, A, B);
	return fallback;
}

function bfIsOnPath(path, r, c) {
	for (let i = 0; i < path.length; i++) {
		if (path[i].r === r && path[i].c === c) return true;
	}
	return false;
}

function bfCellMask(board, r, c) {
	const cell = board.grid[r][c];
	if (!cell) return 0;

	const onOfficial = board.solutionPath && bfIsOnPath(board.solutionPath, r, c);
	let m = 0;
	if (onOfficial && cell.type !== "none" && cell.type !== "blank") {
		m = pieceMask(cell.type, cell.rot);
	}
	if (r === board.A.r && c === board.A.c) m |= board.A.inBit;
	if (r === board.B.r && c === board.B.c) m |= board.B.inBit;
	return m;
}

function bfReachable(board) {
	const n = board.n;
	const A = board.A;
	const key = bfKey;
	const seen = {};
	const q = [{ r: A.r, c: A.c }];
	seen[key(A.r, A.c)] = true;
	const order = [];

	while (q.length) {
		const cur = q.shift();
		order.push(cur);
		const m = bfCellMask(board, cur.r, cur.c);
		const nbs = bfNeighbors(cur.r, cur.c, n);
		for (let i = 0; i < nbs.length; i++) {
			const nb = nbs[i];
			const kk = key(nb.r, nb.c);
			if (seen[kk]) continue;
			if (!(m & nb.bit)) continue;
			const om = bfCellMask(board, nb.r, nb.c);
			if (!(om & opposite(nb.bit))) continue;
			seen[kk] = true;
			q.push({ r: nb.r, c: nb.c });
		}
	}
	return { seen: seen, order: order };
}

function bfPathToB(board) {
	const n = board.n;
	const A = board.A;
	const B = board.B;
	const key = bfKey;
	const prev = {};
	const q = [{ r: A.r, c: A.c }];
	const seen = {};
	seen[key(A.r, A.c)] = true;
	prev[key(A.r, A.c)] = null;

	while (q.length) {
		const cur = q.shift();
		if (cur.r === B.r && cur.c === B.c) {
			const path = [];
			let k = key(B.r, B.c);
			while (k) {
				const parts = k.split(",");
				path.push({ r: +parts[0], c: +parts[1] });
				k = prev[k];
			}
			path.reverse();
			return path;
		}
		const m = bfCellMask(board, cur.r, cur.c);
		const nbs = bfNeighbors(cur.r, cur.c, n);
		for (let i = 0; i < nbs.length; i++) {
			const nb = nbs[i];
			const kk = key(nb.r, nb.c);
			if (seen[kk]) continue;
			if (!(m & nb.bit)) continue;
			const om = bfCellMask(board, nb.r, nb.c);
			if (!(om & opposite(nb.bit))) continue;
			seen[kk] = true;
			prev[kk] = key(cur.r, cur.c);
			q.push({ r: nb.r, c: nb.c });
		}
	}
	return null;
}

/**
 * Packet follows the geometry of the CURRENT piece only.
 * Exit port of the current cell is required.
 * Entry validation of the neighbour is done on arrival.
 */
function bfStepFrom(board, r, c, fromR, fromC) {
	const m = bfCellMask(board, r, c) & 15;

	let entryBit = 0;
	if (fromR != null && fromC != null) {
		entryBit = bitFromDelta(fromR - r, fromC - c);
	}

	const exitMask = entryBit ? (m & ~entryBit) : m;
	const nbs = bfNeighbors(r, c, board.n);

	for (let i = 0; i < nbs.length; i++) {
		const nb = nbs[i];
		if (fromR != null && nb.r === fromR && nb.c === fromC) continue;
		if (!(exitMask & nb.bit)) continue;
		return nb;
	}
	return null;
}

function bfApplySolution(board, path) {
	for (let i = 0; i < path.length; i++) {
		const p = path[i];
		board.grid[p.r][p.c].rot = board.grid[p.r][p.c].solRot;
	}
}

function bfScramblePathFair(board, path) {
	const ratio = TRACE_GAME.scrambleRatio != null ? TRACE_GAME.scrambleRatio : 0.70;
	for (let i = 1; i < path.length - 1; i++) {
		if (Math.random() > ratio) continue;
		const p = path[i];
		const cell = board.grid[p.r][p.c];
		if (cell.fixed) continue;
		const delta = 1 + ((Math.random() * 2) | 0);
		cell.rot = (cell.solRot + delta) % 4;
	}
}

function bfEnsureUnsolvedFair(board, path) {
	/* force the board to be unsolved at start */
	let guard = 0;
	while (bfPathToB(board) && guard < 100) {
		guard++;

		const free = [];
		for (let i = 1; i < path.length - 1; i++) {
			const p = path[i];
			if (!board.grid[p.r][p.c].fixed) free.push(p);
		}
		if (!free.length) break;

		const p = free[(Math.random() * free.length) | 0];
		const cell = board.grid[p.r][p.c];
		cell.rot = (cell.rot + 1 + ((Math.random() * 2) | 0)) % 4;
	}

	/* final safety: if still solved, scramble almost everything */
	if (bfPathToB(board)) {
		for (let i = 1; i < path.length - 1; i++) {
			const p = path[i];
			const cell = board.grid[p.r][p.c];
			if (cell.fixed) continue;
			cell.rot = (cell.solRot + 1 + ((Math.random() * 2) | 0)) % 4;
		}
	}
}

function bfAssertSolvable(board, path) {
	const saved = [];
	for (let i = 0; i < path.length; i++) {
		saved.push(board.grid[path[i].r][path[i].c].rot);
	}
	bfApplySolution(board, path);
	const ok = !!bfPathToB(board);
	for (let i = 0; i < path.length; i++) {
		board.grid[path[i].r][path[i].c].rot = saved[i];
	}
	return ok;
}

function bfGenerateBoard() {
	const n = TRACE_GAME.size;
	const ports = bfPickPorts(n);
	const path = bfCarvePathFair(n, ports.A, ports.B);
	const grid = [];

	for (let r = 0; r < n; r++) {
		grid[r] = [];
		for (let c = 0; c < n; c++) {
			const t = pickPieceType();
			const rot = (Math.random() * 4) | 0;
			grid[r][c] = {
				type: t,
				rot: rot,
				solRot: rot,
				fixed: false,
				locked: false,
				traversed: false,
			};
		}
	}

	for (let i = 0; i < path.length; i++) {
		const cell = path[i];
		let need = 0;
		if (i > 0) {
			const prev = path[i - 1];
			need |= bitFromDelta(prev.r - cell.r, prev.c - cell.c);
		} else {
			need |= ports.A.inBit;
		}
		if (i < path.length - 1) {
			const next = path[i + 1];
			need |= bitFromDelta(next.r - cell.r, next.c - cell.c);
		} else {
			need |= ports.B.inBit;
		}
		const p = pieceForMask(need);
		grid[cell.r][cell.c] = {
			type: p.type,
			rot: p.rot,
			solRot: p.rot,
			fixed: false,
			locked: false,
			traversed: false,
		};
	}

	const off = [];
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			if (!bfIsOnPath(path, r, c)) off.push({ r: r, c: c });
		}
	}
	off.sort(function () { return Math.random() - 0.5; });
	const fixedCount = Math.min(
		off.length,
		Math.max(0, Math.floor(n * n * (TRACE_GAME.fixedTileRatio || 0.12)))
	);
	for (let i = 0; i < fixedCount; i++) {
		grid[off[i].r][off[i].c].fixed = true;
	}

	grid[ports.A.r][ports.A.c].fixed = true;
	grid[ports.A.r][ports.A.c].rot = grid[ports.A.r][ports.A.c].solRot;
	grid[ports.B.r][ports.B.c].fixed = true;
	grid[ports.B.r][ports.B.c].rot = grid[ports.B.r][ports.B.c].solRot;

	const board = {
		n: n,
		grid: grid,
		A: ports.A,
		B: ports.B,
		solutionPath: path,
	};

	/* scramble + force unsolved */
	bfScramblePathFair(board, path);
	bfEnsureUnsolvedFair(board, path);

	/* absolute last safety net */
	if (bfPathToB(board)) {
		bfEnsureUnsolvedFair(board, path);
	}
	if (bfPathToB(board)) {
		/* still solved → force every intermediate cell wrong */
		for (let i = 1; i < path.length - 1; i++) {
			const p = path[i];
			const cell = board.grid[p.r][p.c];
			if (!cell.fixed) cell.rot = (cell.solRot + 1) % 4;
		}
	}

	return board;
}
