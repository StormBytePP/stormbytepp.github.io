const bfRender = {
	svg: null,
	boardG: null,
	packetG: null,
	tileEls: {},
	pad: 36,
};

function bfEnsureOverlay() {
	let root = document.getElementById("bf-overlay");

	if (!root) {
		root = document.createElement("div");
		root.id = "bf-overlay";
		root.className = "bf-overlay";
		root.hidden = true;
		document.body.appendChild(root);
	}

	root.innerHTML =
		'<div class="bf-panel" role="dialog" aria-label="Trace Repair">' +
		'<div class="bf-header">' +
		'<div class="bf-header-left">' +
		'<span class="bf-title" id="bf-title"></span>' +
		'<span class="bf-sub" id="bf-sub"></span>' +
		"</div>" +
		'<div class="bf-packets" id="bf-packets-display"></div>' +
		'<div class="bf-sys" id="bf-sys"><span>SYS:</span> <span id="bf-sys-label">OK</span> ' +
		'<span class="bf-sys-dot"></span></div>' +
		'<button type="button" class="bf-close" id="bf-close" title="Close">×</button>' +
		"</div>" +
		'<div class="bf-stage">' +
		'<div class="bf-board-wrap"><svg id="bf-svg" xmlns="http://www.w3.org/2000/svg"></svg>' +
		'<div class="bf-banner" id="bf-banner">' +
		'<div class="bf-banner-title" id="bf-banner-title"></div>' +
		'<div class="bf-banner-sub" id="bf-banner-sub"></div></div></div>' +
		"</div>" +
		'<div class="bf-hint" id="bf-hint"></div>' +
		"</div>";

	return root;
}

function bfEnsureCss(done) {
	const existing = document.getElementById("bf-css");
	if (existing) {
		/* force reload to avoid stale cache */
		existing.href = "css/busfabric/busfabric.css?t=" + Date.now();
		existing.onload = function () { if (done) done(); };
		existing.onerror = function () { if (done) done(); };
		return;
	}

	const link = document.createElement("link");
	link.id = "bf-css";
	link.rel = "stylesheet";
	link.href = "css/busfabric/busfabric.css?t=" + Date.now();
	link.onload = function () { if (done) done(); };
	link.onerror = function () { if (done) done(); };
	document.head.appendChild(link);
}

function bfMountSvg(board) {
	const svg = document.getElementById("bf-svg");
	bfRender.svg = svg;
	while (svg.firstChild) svg.removeChild(svg.firstChild);

	const n = board.n;
	const cell = TRACE_GAME.cellPx;
	const gap = TRACE_GAME.gapPx;
	const step = cell + gap;
	const pad = 36;
	bfRender.pad = pad;

	const w = n * step + gap + pad * 2;
	const h = n * step + gap + pad * 2;
	svg.setAttribute("viewBox", "0 0 " + w + " " + h);
	svg.setAttribute("width", String(w));
	svg.setAttribute("height", String(h));

	const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
	defs.innerHTML =
		'<filter id="bf-bevel" x="-20%" y="-20%" width="140%" height="140%">' +
		'<feDropShadow dx="1.2" dy="1.2" stdDeviation="0.6" flood-color="#000" flood-opacity="0.65"/>' +
		'<feDropShadow dx="-0.6" dy="-0.6" stdDeviation="0.4" flood-color="#3a4a40" flood-opacity="0.35"/>' +
		"</filter>" +
		'<filter id="bf-glow-hot">' +
		'<feGaussianBlur stdDeviation="1.4" result="b"/>' +
		'<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
		"</filter>";
	svg.appendChild(defs);

	const boardG = document.createElementNS("http://www.w3.org/2000/svg", "g");
	boardG.setAttribute("id", "bf-board");
	boardG.setAttribute("transform", "translate(" + pad + " " + pad + ")");
	svg.appendChild(boardG);
	bfRender.boardG = boardG;

	const packetG = document.createElementNS("http://www.w3.org/2000/svg", "g");
	packetG.setAttribute("id", "bf-packets");
	packetG.setAttribute("transform", "translate(" + pad + " " + pad + ")");
	svg.appendChild(packetG);
	bfRender.packetG = packetG;

	bfRender.tileEls = {};
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			const x = gap + c * step;
			const y = gap + r * step;
			const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
			g.setAttribute("class", "bf-tile");
			g.setAttribute("data-r", String(r));
			g.setAttribute("data-c", String(c));

			const base = "translate(" + (x + cell / 2) + " " + (y + cell / 2) + ")";
			g.setAttribute("transform", base);
			g.setAttribute("data-base-transform", base);

			const plate = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			plate.setAttribute("class", "bf-tile-plate");
			plate.setAttribute("x", String(-cell / 2));
			plate.setAttribute("y", String(-cell / 2));
			plate.setAttribute("width", String(cell));
			plate.setAttribute("height", String(cell));
			plate.setAttribute("rx", "3");
			g.appendChild(plate);

			const bus = document.createElementNS("http://www.w3.org/2000/svg", "path");
			bus.setAttribute("class", "bf-bus");
			g.appendChild(bus);

			const hi = document.createElementNS("http://www.w3.org/2000/svg", "path");
			hi.setAttribute("class", "bf-bus-hi");
			g.appendChild(hi);

			boardG.appendChild(g);
			bfRender.tileEls[r + "," + c] = g;
		}
	}

	bfDrawPorts(board, pad, cell, gap, step);
}

function bfDrawPorts(board, pad, cell, gap, step) {
	const svg = bfRender.svg;
	const old = svg.querySelectorAll(".bf-port-label, .bf-port-stub");
	for (let i = 0; i < old.length; i++) old[i].remove();

	function place(port, label) {
		const x = pad + gap + port.c * step + cell / 2;
		const y = pad + gap + port.r * step + cell / 2;
		const edge = port.edge;
		let lx = x, ly = y, anchor = "middle", stub = "";

		if (edge === "W") {
			lx = pad - 4; ly = y + 3; anchor = "end";
			stub = "M " + (x - cell / 2) + " " + y + " L " + (x - cell / 2 - 12) + " " + y;
		} else if (edge === "E") {
			lx = pad + board.n * step + gap + 4; ly = y + 3; anchor = "start";
			stub = "M " + (x + cell / 2) + " " + y + " L " + (x + cell / 2 + 12) + " " + y;
		} else if (edge === "N") {
			lx = x; ly = pad - 8;
			stub = "M " + x + " " + (y - cell / 2) + " L " + x + " " + (y - cell / 2 - 12);
		} else {
			lx = x; ly = pad + board.n * step + gap + 14;
			stub = "M " + x + " " + (y + cell / 2) + " L " + x + " " + (y + cell / 2 + 12);
		}

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("class", "bf-port-stub");
		path.setAttribute("d", stub);
		svg.appendChild(path);

		const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
		t.setAttribute("class", "bf-port-label");
		t.setAttribute("x", String(lx));
		t.setAttribute("y", String(ly));
		t.setAttribute("text-anchor", anchor);
		t.textContent = label;
		svg.appendChild(t);
	}

	place(board.A, "DATA_IN");
	place(board.B, "DATA_OUT");
}

function bfPaintTile(board, r, c) {
	const cell = board.grid[r][c];
	const el = bfRender.tileEls[r + "," + c];
	if (!el) return;

	const size = TRACE_GAME.cellPx;
	const d = busPathD(cell.type, cell.rot, -size / 2, -size / 2, size);
	const bus = el.querySelector(".bf-bus");
	const hi = el.querySelector(".bf-bus-hi");
	if (bus) bus.setAttribute("d", d);
	if (hi)  hi.setAttribute("d", d);

	el.classList.toggle("fixed", !!cell.fixed);
	el.classList.toggle("locked", !!cell.locked);
	el.classList.toggle("traversed", !!cell.traversed);
}

function bfPaintAll(board) {
	for (let r = 0; r < board.n; r++) {
		for (let c = 0; c < board.n; c++) {
			bfPaintTile(board, r, c);
		}
	}
}

function bfPaintHints(board, seen) {
	if (!TRACE_GAME.pathHint) return;
	for (let r = 0; r < board.n; r++) {
		for (let c = 0; c < board.n; c++) {
			const el = bfRender.tileEls[r + "," + c];
			if (!el) continue;
			const on = !!(seen && seen[r + "," + c]);
			el.classList.toggle("hot", on);
			const bus = el.querySelector(".bf-bus");
			if (bus) {
				if (on) {
					bus.setAttribute("filter", "url(#bf-glow-hot)");
					bus.style.strokeOpacity = String(0.55 + (TRACE_GAME.pathHintOpacity || 0.30) * 0.5);
				} else {
					bus.removeAttribute("filter");
					bus.style.strokeOpacity = "";
				}
			}
		}
	}
}

function bfCellCenter(r, c) {
	const cell = TRACE_GAME.cellPx;
	const gap = TRACE_GAME.gapPx;
	const step = cell + gap;
	return {
		x: gap + c * step + cell / 2,
		y: gap + r * step + cell / 2,
	};
}

function bfTileBaseTransform(r, c) {
	const cellPx = TRACE_GAME.cellPx;
	const gap = TRACE_GAME.gapPx;
	const step = cellPx + gap;
	const x = gap + c * step + cellPx / 2;
	const y = gap + r * step + cellPx / 2;
	return "translate(" + x + " " + y + ")";
}

function bfAnimateRotate(el, done) {
	const lift  = TRACE_GAME.rotateLiftMs   || 90;
	const spin  = TRACE_GAME.rotateSpinMs   || 160;
	const seat  = TRACE_GAME.rotateSeatMs   || 80;
	const scale = TRACE_GAME.rotateLiftScale || 1.12;

	const base = el.getAttribute("data-base-transform") || el.getAttribute("transform") || "";
	el.setAttribute("data-base-transform", base);
	el.classList.add("rotating");
	el.style.transition = "transform " + lift + "ms ease-out, filter " + lift + "ms ease-out";
	el.style.filter = "drop-shadow(0 14px 8px rgba(0,0,0,0.65))";
	el.setAttribute("transform", base + " translate(0, -8) scale(" + scale + ")");

	setTimeout(function () {
		el.style.transition = "transform " + spin + "ms cubic-bezier(0.25, 0.8, 0.25, 1)";
		el.setAttribute("transform", base + " translate(0, -8) scale(" + scale + ") rotate(90)");
		setTimeout(function () {
			el.style.transition = "none";
			el.style.filter = "";
			el.setAttribute("transform", base);
			el.classList.remove("rotating");
			void el.getBoundingClientRect();
			el.style.transition = "";
			if (done) done();
		}, spin + seat * 0.25);
	}, lift);
}

function bfShowBanner(kind, title, sub) {
	const banner = document.getElementById("bf-banner");
	const t = document.getElementById("bf-banner-title");
	const s = document.getElementById("bf-banner-sub");
	const sys = document.getElementById("bf-sys");
	const lab = document.getElementById("bf-sys-label");
	if (!banner) return;
	banner.className = "bf-banner show " + kind;
	if (t) t.textContent = title;
	if (s) s.textContent = sub || "";
	if (sys) {
		sys.classList.toggle("is-fault", kind === "fault");
		sys.classList.toggle("is-win", kind === "win");
	}
	if (lab) lab.textContent = kind === "fault" ? "FAULT" : "OK";
}

function bfHideBanner() {
	const banner = document.getElementById("bf-banner");
	if (banner) banner.className = "bf-banner";
}
