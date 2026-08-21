function initCircuit(reduced) {
	const svg = document.getElementById("skill-circuit");
	const host = document.getElementById("skill-chips");
	const wrap = document.getElementById("skill-circuit-wrap");
	if (!svg || !host || !wrap) {
		return;
	}

	function layoutChips() {
		host.innerHTML = "";
		SKILL_CHIPS.forEach(function (chip) {
			const el = document.createElement("button");
			el.type = "button";
			el.className = "skill-chip" + (chip.hub ? " chip-hub" : "");
			if (chip.id === "bc") {
				el.classList.add("chip-secondary-hub");
			}
			el.id = "chip-" + chip.id;
			el.style.setProperty("--x", chip.x + "%");
			el.style.setProperty("--y", chip.y + "%");
			el.innerHTML =
				'<span class="chip-icon">' +
				chip.icon +
				"</span>" +
				'<span class="chip-label">' +
				chip.label +
				"</span>";

			["left", "right", "top", "bottom"].forEach(function (side) {
				const pins = document.createElement("span");
				pins.className = "chip-pins chip-pins-" + side;
				for (let i = 0; i < SKILL_FX.pinsPerSide; i++) {
					const pin = document.createElement("span");
					pin.className = "pin";
					pins.appendChild(pin);
				}
				el.appendChild(pins);
			});

			el.addEventListener("click", function () {
				el.classList.add("chip-hot");
				setTimeout(function () {
					el.classList.remove("chip-hot");
				}, SKILL_FX.glowHoldMs);
				if (typeof exciteWave === "function") {
					exciteWave();
				}
			});

			host.appendChild(el);
			scheduleGlow(el);
		});
	}

	function scheduleGlow(el) {
		if (reduced) {
			return;
		}
		function loop() {
			const wait =
				SKILL_FX.glowMinMs +
				Math.random() * (SKILL_FX.glowMaxMs - SKILL_FX.glowMinMs);
			setTimeout(function () {
				el.classList.add("chip-hot");
				setTimeout(function () {
					el.classList.remove("chip-hot");
					loop();
				}, SKILL_FX.glowHoldMs);
			}, wait);
		}
		loop();
	}

	function pctToSvg(xPct, yPct, w, h) {
		return { x: (xPct / 100) * w, y: (yPct / 100) * h };
	}

	function manhattan(a, b, bend) {
		const mx = bend === "hv" ? b.x : a.x;
		const my = bend === "hv" ? a.y : b.y;
		return "M " + a.x + " " + a.y + " L " + mx + " " + my + " L " + b.x + " " + b.y;
	}

	function parallelPath(a, b, offset, bend) {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len = Math.sqrt(dx * dx + dy * dy) || 1;
		const ox = (-dy / len) * offset;
		const oy = (dx / len) * offset;
		return manhattan(
			{ x: a.x + ox, y: a.y + oy },
			{ x: b.x + ox, y: b.y + oy },
			bend
		);
	}

	function edgeStub(p, dir, overshoot, offset, w, h) {
		const o = overshoot;
		if (dir === "left") {
			return "M " + (p.x + offset) + " " + p.y + " L " + -o + " " + p.y;
		}
		if (dir === "right") {
			return "M " + (p.x + offset) + " " + p.y + " L " + (w + o) + " " + p.y;
		}
		if (dir === "up") {
			return "M " + p.x + " " + (p.y + offset) + " L " + p.x + " " + -o;
		}
		return "M " + p.x + " " + (p.y + offset) + " L " + p.x + " " + (h + o);
	}

	function addTrace(d) {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", d);
		path.setAttribute("class", "circuit-trace");
		path.setAttribute("fill", "none");
		svg.appendChild(path);
		return path;
	}

	function addPacket(pathEl, duration, delay) {
		if (reduced || !pathEl) {
			return;
		}
		const packet = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		packet.setAttribute("width", String(SKILL_FX.packetW));
		packet.setAttribute("height", String(SKILL_FX.packetH));
		packet.setAttribute("class", "circuit-packet");
		packet.setAttribute("rx", "0.5");

		const motion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
		motion.setAttribute("dur", duration + "s");
		motion.setAttribute("repeatCount", "indefinite");
		motion.setAttribute("begin", delay + "s");
		motion.setAttribute("rotate", "auto");

		const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
		const id = "p" + Math.random().toString(36).slice(2, 9);
		pathEl.setAttribute("id", id);
		mpath.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + id);
		mpath.setAttribute("href", "#" + id);

		motion.appendChild(mpath);
		packet.appendChild(motion);
		svg.appendChild(packet);
	}

	function busBetween(list, a, b, bend, lines) {
		const space = SKILL_FX.busSpacing;
		for (let i = 0; i < lines; i++) {
			const off = (i - (lines - 1) / 2) * space;
			list.push(addTrace(parallelPath(a, b, off, bend)));
		}
	}

	function seedPackets(pathList, count) {
		if (!pathList.length || count <= 0) {
			return;
		}
		for (let i = 0; i < count; i++) {
			const pathEl = pathList[i % pathList.length];
			const dur =
				SKILL_FX.packetDurationMin +
				Math.random() * (SKILL_FX.packetDurationMax - SKILL_FX.packetDurationMin);
			addPacket(pathEl, dur, Math.random() * dur);
		}
	}

	function drawTraces() {
		while (svg.firstChild) {
			svg.removeChild(svg.firstChild);
		}

		const w = wrap.clientWidth || 600;
		const h = wrap.clientHeight || 300;
		svg.setAttribute("viewBox", "0 0 " + w + " " + h);
		svg.setAttribute("width", String(w));
		svg.setAttribute("height", String(h));

		const pts = {};
		SKILL_CHIPS.forEach(function (c) {
			pts[c.id] = pctToSvg(c.x, c.y, w, h);
		});

		const hub = pts.hub;
		const elixir = pts.bc;
		const hubPaths = [];
		const elixirPaths = [];
		const peerPaths = [];
		const topRowPaths = [];
		const edgePaths = [];

		const hubN = SKILL_FX.busLines;
		const elixN = SKILL_FX.busLinesElixir || hubN;
		const peerN = SKILL_FX.busLinesPeer || Math.max(3, hubN - 1);

		[
			{ id: "tl", bend: "hv" },
			{ id: "tr", bend: "hv" },
			{ id: "ml", bend: "vh" },
			{ id: "mr", bend: "vh" },
			{ id: "bl", bend: "hv" },
			{ id: "br", bend: "hv" },
			{ id: "bc", bend: "vh" },
		].forEach(function (link) {
			if (pts[link.id]) {
				busBetween(hubPaths, hub, pts[link.id], link.bend, hubN);
			}
		});

		if (elixir) {
			[
				{ id: "hub", bend: "vh" },
				{ id: "bl", bend: "hv" },
				{ id: "br", bend: "hv" },
				{ id: "ml", bend: "hv" },
				{ id: "mr", bend: "hv" },
				{ id: "tl", bend: "vh" },
				{ id: "tr", bend: "vh" },
			].forEach(function (link) {
				const target = link.id === "hub" ? hub : pts[link.id];
				if (target) {
					busBetween(elixirPaths, elixir, target, link.bend, elixN);
				}
			});
		}

		/* Bash ↔ CMake (priority top row) */
		if (pts.tl && pts.tr) {
			busBetween(topRowPaths, pts.tl, pts.tr, "hv", peerN + 2);
			busBetween(peerPaths, pts.tl, pts.tr, "hv", peerN + 2);
		}

		[
			{ a: "tl", b: "ml", bend: "vh" },
			{ a: "ml", b: "bl", bend: "vh" },
			{ a: "tl", b: "bl", bend: "vh" },
			{ a: "tr", b: "mr", bend: "vh" },
			{ a: "mr", b: "br", bend: "vh" },
			{ a: "tr", b: "br", bend: "vh" },
			{ a: "ml", b: "mr", bend: "hv" },
			{ a: "bl", b: "br", bend: "hv" },
			{ a: "tl", b: "mr", bend: "hv" },
			{ a: "tr", b: "ml", bend: "hv" },
			{ a: "bl", b: "mr", bend: "hv" },
			{ a: "br", b: "ml", bend: "hv" },
		].forEach(function (link) {
			if (pts[link.a] && pts[link.b]) {
				busBetween(peerPaths, pts[link.a], pts[link.b], link.bend, peerN);
			}
		});

		[
			{ p: pts.tl, dir: "left" },
			{ p: pts.tl, dir: "up" },
			{ p: pts.tr, dir: "right" },
			{ p: pts.tr, dir: "up" },
			{ p: pts.ml, dir: "left" },
			{ p: pts.mr, dir: "right" },
			{ p: pts.bl, dir: "left" },
			{ p: pts.bl, dir: "down" },
			{ p: pts.br, dir: "right" },
			{ p: pts.br, dir: "down" },
			{ p: elixir, dir: "down" },
			{ p: hub, dir: "up" },
		].forEach(function (e) {
			if (!e.p) {
				return;
			}
			for (let i = 0; i < SKILL_FX.edgeLines; i++) {
				const off = (i - (SKILL_FX.edgeLines - 1) / 2) * SKILL_FX.busSpacing;
				edgePaths.push(
					addTrace(edgeStub(e.p, e.dir, SKILL_FX.edgeOvershoot, off, w, h))
				);
			}
		});

		const total = SKILL_FX.packetCount;
		const nHub = Math.round(total * SKILL_FX.packetShareHub);
		const nElix = Math.round(total * SKILL_FX.packetShareElixir);
		const nPeer = Math.round(total * SKILL_FX.packetSharePeer);
		const nEdge = Math.max(0, total - nHub - nElix - nPeer);

		seedPackets(hubPaths, nHub);
		seedPackets(elixirPaths, nElix);
		seedPackets(topRowPaths, Math.max(12, Math.round(nPeer * 0.35)));
		seedPackets(peerPaths, nPeer);
		seedPackets(edgePaths, nEdge);
	}

	layoutChips();
	drawTraces();

	let resizeTimer = null;
	window.addEventListener("resize", function () {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(drawTraces, SKILL_FX.resizeDebounceMs);
	});
}

function buildCircuit(reduced) {
	initCircuit(reduced);
}
