/**
 * Packet always follows piece geometry.
 * On entering a cell → mark current, unmark previous, lock it.
 * Fault only when a true dead-end is reached.
 * Win only when DATA_OUT is reached.
 */

const bfGame = {
	active: false,
	level: 1,
	board: null,
	speed: 0,
	packets: [],
	delivered: 0,
	packetsLeft: 0,          // remaining lives
	raf: 0,
	dataStarted: false,
	startTimer: 0,
	winTimer: 0,
	faultTimer: 0,
	busyRotate: false,
	ending: false,
	boardPathLocked: false,
	_last: 0,
	_onKey: null,
};

function bfShowPackets() {
	const box = document.getElementById("bf-packets-display");
	if (!box) return;

	const max = TRACE_GAME.startingPackets || 3;
	const left = Math.max(0, bfGame.packetsLeft | 0);

	box.innerHTML = "";

	for (let i = 0; i < max; i++) {
		const el = document.createElement("div");
		el.className = "bf-packet-life" + (i < left ? " is-alive" : " is-broken");
		el.title = i < left ? "Packet available" : "Packet lost";
		box.appendChild(el);
	}

	const lab = document.getElementById("bf-sys-label");
	if (lab) lab.textContent = left <= 0 ? "FAULT" : "OK";
}

function bfPathComplete() {
	return !!bfPathToB(bfGame.board);
}

function bfLockAllTiles(on) {
	if (!bfGame.board) return;
	const n = bfGame.board.n;
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			const el = bfRender.tileEls[r + "," + c];
			if (el) el.classList.toggle("path-locked", !!on);
		}
	}
	bfGame.boardPathLocked = !!on;
}

function bfOnPathSolved() {
	if (bfGame.boardPathLocked || bfGame.ending) return;
	if (!bfPathComplete()) return;
	if (!bfGame.dataStarted) return;

	const path = bfGame.board.solutionPath;
	if (!path) return;

	/* lock + mark ONLY the official path cells */
	for (let i = 0; i < path.length; i++) {
		const p = path[i];
		const cell = bfGame.board.grid[p.r][p.c];
		cell.locked = true;
		cell.traversed = true;
		const el = bfRender.tileEls[p.r + "," + p.c];
		if (el) {
			el.classList.add("locked", "traversed", "path-locked");
		}
	}
	bfGame.boardPathLocked = true;

	const mult = typeof TRACE_GAME.solveSpeedMult === "number"
		? TRACE_GAME.solveSpeedMult
		: 12;
	bfGame.speed = Math.max(bfGame.speed, TRACE_GAME.speed0) * mult;
}

function bfPacketOccupies(r, c) {
	for (let i = 0; i < bfGame.packets.length; i++) {
		const pk = bfGame.packets[i];
		if (pk.done) continue;
		if (pk.r === r && pk.c === c) return true;
	}
	return false;
}

function bfSyncLiveLocks() {
	if (!bfGame.board) return;
	const n = bfGame.board.n;

	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			const cell = bfGame.board.grid[r][c];
			const live = bfPacketOccupies(r, c);
			const el = bfRender.tileEls[r + "," + c];
			if (el) {
				el.classList.toggle("live", live);
				el.classList.toggle("traversed", !!cell.traversed);
				el.classList.toggle(
					"locked",
					!!cell.locked || !!cell.traversed || live || !!bfGame.boardPathLocked
				);
			}
		}
	}
}

function bfMarkOccupied(r, c) {
	if (!bfGame.board) return;
	const cell = bfGame.board.grid[r][c];
	if (!cell) return;

	if (TRACE_GAME.lockTraversed) {
		cell.traversed = true;
		cell.locked = true;
	}
	bfPaintTile(bfGame.board, r, c);
	bfSyncLiveLocks();
}

function bfRefreshConnectivity() {
	const reach = bfReachable(bfGame.board);
	bfPaintHints(bfGame.board, reach.seen);
	bfSyncLiveLocks();
	if (bfPathComplete()) bfOnPathSolved();
	else bfLockAllTiles(false);
	return reach;
}

function bfCanRotate(r, c) {
	if (bfGame.boardPathLocked) return false;
	const cell = bfGame.board.grid[r][c];
	if (!cell || cell.fixed || cell.locked || cell.traversed) return false;
	if (bfPacketOccupies(r, c)) return false;
	return true;
}

function bfOnTileClick(r, c) {
	if (!bfGame.active || bfGame.ending || bfGame.busyRotate) return;
	if (!bfCanRotate(r, c)) return;

	const el = bfRender.tileEls[r + "," + c];
	const cell = bfGame.board.grid[r][c];
	bfGame.busyRotate = true;

	bfAnimateRotate(el, function () {
		cell.rot = (cell.rot + 1) % 4;
		bfPaintTile(bfGame.board, r, c);
		const base = bfTileBaseTransform(r, c);
		el.setAttribute("transform", base);
		el.setAttribute("data-base-transform", base);
		bfGame.busyRotate = false;
		bfRefreshConnectivity();
	});
}

function bfFault(at) {
	if (bfGame.ending) return;
	bfGame.ending = true;

	if (at) {
		const el = bfRender.tileEls[at.r + "," + at.c];
		if (el) el.classList.add("fault-flash");
	}

	bfGame.packetsLeft = Math.max(0, bfGame.packetsLeft - 1);
	bfShowPackets();

	if (bfGame.packetsLeft <= 0) {
		bfShowBanner("fault", "BUS FAULT — NO PACKETS LEFT", "session terminated");
		clearTimeout(bfGame.faultTimer);
		bfGame.faultTimer = setTimeout(function () {
			stopBusFabric();
		}, TRACE_GAME.faultExitMs || 2600);
		return;
	}

	bfShowBanner("fault", TRACE_GAME.msgFaultTitle,
		"packets remaining: " + bfGame.packetsLeft);

	clearTimeout(bfGame.faultTimer);
	bfGame.faultTimer = setTimeout(function () {
		if (!bfGame.active) return;
		bfGame.ending = false;
		bfHideBanner();
		bfStartLevel();
	}, TRACE_GAME.faultExitMs || 2600);
}

function bfWinLevel() {
	if (bfGame.ending) return;
	bfGame.ending = true;
	bfShowBanner("win", TRACE_GAME.msgWinTitle, TRACE_GAME.msgWinSub);

	clearTimeout(bfGame.winTimer);
	bfGame.winTimer = setTimeout(function () {
		if (!bfGame.active) return;

		bfGame.level += 1;
		bfGame.speed = TRACE_GAME.speed0 * Math.pow(TRACE_GAME.speedGrowth, bfGame.level - 1);
		bfGame.ending = false;
		bfHideBanner();
		bfStartLevel();
	}, TRACE_GAME.winPulseMs || 2200);
}

function bfSpawnPacket() {
	const A = bfGame.board.A;
	const cellA = bfGame.board.grid[A.r][A.c];

	/* safety: first piece is always correct and non-rotatable */
	cellA.rot = cellA.solRot;
	cellA.fixed = true;
	cellA.locked = true;
	cellA.traversed = true;

	bfGame.packets.push({
		r: A.r,
		c: A.c,
		prevR: null,
		prevC: null,
		t: 0,
		done: false,
		el: null,
		dirBit: null,
		nextR: null,
		nextC: null,
		/* start from the external entry port */
		startFromEntry: true,
	});

	bfMarkOccupied(A.r, A.c);
	bfPaintTile(bfGame.board, A.r, A.c);
}

function bfEnsurePacketEl(pk) {
	if (pk.el) return;
	const el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	el.setAttribute("class", "bf-packet");
	el.setAttribute("width", "10");
	el.setAttribute("height", "5");
	el.setAttribute("rx", "1.5");
	bfRender.packetG.appendChild(el);
	pk.el = el;
}

function bfPortPoint(r, c, bit) {
	const ca = bfCellCenter(r, c);
	const h = TRACE_GAME.cellPx * 0.5;
	if (bit === BF_N) return { x: ca.x, y: ca.y - h };
	if (bit === BF_S) return { x: ca.x, y: ca.y + h };
	if (bit === BF_E) return { x: ca.x + h, y: ca.y };
	if (bit === BF_W) return { x: ca.x - h, y: ca.y };
	return { x: ca.x, y: ca.y };
}

function bfTickPackets(dt) {
	if (!bfGame.dataStarted || bfGame.ending) return;
	const B = bfGame.board.B;

	for (let i = 0; i < bfGame.packets.length; i++) {
		const pk = bfGame.packets[i];
		if (pk.done) continue;

		/* WIN */
		if (pk.r === B.r && pk.c === B.c) {
			pk.done = true;
			if (pk.el) {
				pk.el.remove();
				pk.el = null;
			}
			bfMarkOccupied(B.r, B.c);
			bfGame.delivered += 1;
			if (bfGame.delivered >= (TRACE_GAME.packetsToWin || 1)) {
				bfWinLevel();
			}
			continue;
		}

		/* decide direction once per cell */
		if (pk.dirBit == null) {
			const step = bfStepFrom(bfGame.board, pk.r, pk.c, pk.prevR, pk.prevC);
			if (!step) {
				bfFault({ r: pk.r, c: pk.c });
				return;
			}
			pk.dirBit = bitFromDelta(step.r - pk.r, step.c - pk.c);
			pk.nextR = step.r;
			pk.nextC = step.c;
			bfMarkOccupied(pk.r, pk.c);
		}

		pk.t += dt * bfGame.speed;

		/* EXIT EDGE */
		if (pk.t >= 1) {
			const exitP = bfPortPoint(pk.r, pk.c, pk.dirBit);
			bfEnsurePacketEl(pk);
			pk.el.setAttribute("x", String(exitP.x - 5));
			pk.el.setAttribute("y", String(exitP.y - 2.5));

			const m = bfCellMask(bfGame.board, pk.r, pk.c) & 15;

			/* 1) current piece must open this exit */
			if (!(m & pk.dirBit)) {
				bfFault({ r: pk.r, c: pk.c });
				return;
			}

			/* 2) next cell MUST accept the entry – if not, do NOT enter */
			const entryBit = opposite(pk.dirBit);
			const nextMask = bfCellMask(bfGame.board, pk.nextR, pk.nextC) & 15;
			if (!(nextMask & entryBit)) {
				bfFault({ r: pk.r, c: pk.c });
				return;
			}

			/* both ok → cross */
			pk.prevR = pk.r;
			pk.prevC = pk.c;
			pk.r = pk.nextR;
			pk.c = pk.nextC;
			pk.t = 0;
			pk.dirBit = null;

			bfMarkOccupied(pk.r, pk.c);
		}

		/* visual: entry → center → exit */
		if (pk.t < 1 && pk.dirBit != null) {
			const ca = bfCellCenter(pk.r, pk.c);
			const t = Math.max(0, Math.min(1, pk.t));

			let entryP;
			if (pk.prevR == null) {
				entryP = bfPortPoint(pk.r, pk.c, bfGame.board.A.inBit);
			} else {
				const entryBit = bitFromDelta(pk.prevR - pk.r, pk.prevC - pk.c);
				entryP = bfPortPoint(pk.r, pk.c, entryBit);
			}

			const exitP = bfPortPoint(pk.r, pk.c, pk.dirBit);

			let x, y;
			if (t < 0.5) {
				const u = t * 2;
				x = entryP.x + (ca.x - entryP.x) * u;
				y = entryP.y + (ca.y - entryP.y) * u;
			} else {
				const u = (t - 0.5) * 2;
				x = ca.x + (exitP.x - ca.x) * u;
				y = ca.y + (exitP.y - ca.y) * u;
			}

			bfEnsurePacketEl(pk);
			pk.el.setAttribute("x", String(x - 5));
			pk.el.setAttribute("y", String(y - 2.5));
		}
	}
}

function bfLoop(now) {
	if (!bfGame.active) return;
	if (!bfGame._last) bfGame._last = now;
	const dt = Math.min(0.05, (now - bfGame._last) / 1000);
	bfGame._last = now;
	bfTickPackets(dt);
	bfGame.raf = requestAnimationFrame(bfLoop);
}

function bfBindTiles() {
	Object.keys(bfRender.tileEls).forEach(function (k) {
		const el = bfRender.tileEls[k];
		el.onclick = function () {
			bfOnTileClick(+el.getAttribute("data-r"), +el.getAttribute("data-c"));
		};
	});
}

function bfOnKeyDown(e) {
	if (e.key === "Escape" || e.key === "Esc") {
		if (bfGame.active) {
			e.preventDefault();
			e.stopPropagation();
			stopBusFabric();
		}
	}
}

function bfStartLevel() {
	clearTimeout(bfGame.startTimer);
	bfGame.startTimer = 0;
	bfGame.packets = [];
	bfGame.delivered = 0;
	bfGame.dataStarted = false;
	bfGame.busyRotate = false;
	bfGame.boardPathLocked = false;
	bfGame.ending = false;

	bfHideBanner();
	bfShowPackets();

	const sys = document.getElementById("bf-sys");
	if (sys) {
		sys.classList.remove("is-fault", "is-win");
	}

	if (bfRender.packetG) {
		while (bfRender.packetG.firstChild) {
			bfRender.packetG.removeChild(bfRender.packetG.firstChild);
		}
	}

	bfGame.board = bfGenerateBoard();
	bfMountSvg(bfGame.board);
	bfPaintAll(bfGame.board);
	bfRefreshConnectivity();
	bfBindTiles();

	bfGame.startTimer = setTimeout(function () {
		if (!bfGame.active || bfGame.ending) return;
		bfGame.dataStarted = true;
		bfSpawnPacket();
	}, TRACE_GAME.dataStartDelayMs || 2800);
}

function startBusFabric() {
	stopBusFabric();

	bfEnsureCss(function () {
		bfEnsureOverlay();
		const root = document.getElementById("bf-overlay");
		document.getElementById("bf-title").textContent = TRACE_GAME.title;
		document.getElementById("bf-sub").textContent = TRACE_GAME.subtitle;
		document.getElementById("bf-hint").textContent = TRACE_GAME.hint;
		root.hidden = false;
		document.getElementById("bf-close").onclick = function () {
			stopBusFabric();
		};

		bfGame.active = true;
		bfGame.ending = false;
		bfGame.level = 1;
		bfGame.speed = TRACE_GAME.speed0;
		bfGame._last = 0;
		bfGame.packets = [];
		bfGame.delivered = 0;
		bfGame.dataStarted = false;
		bfGame.busyRotate = false;
		bfGame.boardPathLocked = false;
		bfGame.packetsLeft = TRACE_GAME.startingPackets || 3;

		bfShowPackets();

		if (bfGame._onKey) {
			document.removeEventListener("keydown", bfGame._onKey, true);
		}
		bfGame._onKey = bfOnKeyDown;
		document.addEventListener("keydown", bfGame._onKey, true);

		bfStartLevel();

		if (bfGame.raf) cancelAnimationFrame(bfGame.raf);
		bfGame.raf = requestAnimationFrame(bfLoop);
	});
}

function stopBusFabric() {
	const wasActive = bfGame.active;

	bfGame.active = false;
	bfGame.ending = false;
	bfGame.boardPathLocked = false;
	bfGame.dataStarted = false;
	bfGame.busyRotate = false;
	bfGame.packets = [];
	bfGame.delivered = 0;
	bfGame.packetsLeft = 0;
	bfGame._last = 0;

	clearTimeout(bfGame.startTimer);
	bfGame.startTimer = 0;
	clearTimeout(bfGame.winTimer);
	bfGame.winTimer = 0;
	clearTimeout(bfGame.faultTimer);
	bfGame.faultTimer = 0;

	if (bfGame.raf) {
		cancelAnimationFrame(bfGame.raf);
		bfGame.raf = 0;
	}

	if (bfGame._onKey) {
		document.removeEventListener("keydown", bfGame._onKey, true);
		bfGame._onKey = null;
	}

	const root = document.getElementById("bf-overlay");
	if (root) root.hidden = true;
	bfHideBanner();

	if (bfRender.packetG) {
		while (bfRender.packetG.firstChild) {
			bfRender.packetG.removeChild(bfRender.packetG.firstChild);
		}
	}

	if (wasActive && typeof termUi !== "undefined" && termUi.append) {
		termUi.append("DOSBox: TRACE.EXE terminated — session closed.");
		termUi.append("");
		if (termUi.focusInput) termUi.focusInput();
	}
}
