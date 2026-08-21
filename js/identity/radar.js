const radarCtl = {
	angle: -Math.PI / 2,
	raf: 0,
	dots: [],
	sweepLine: null,
	sweepGlow: null,
	trail: null,
	cx: 0,
	cy: 0,
	radius: 0,
	paused: false,
	hover: 0,
	hoverTarget: 0,
	baseSpeed: (Math.PI * 2) / 2.8,
	hoverSpeed: (Math.PI * 2) / 1.1,
	colorT: 0,
	baseValues: [],
	nAxes: 0,
	areaEl: null,
	seed: Math.random() * 1000,
};

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function lerpColor(t) {
	const r = Math.round(lerp(0x7c, 0xff, t));
	const g = Math.round(lerp(0xff, 0x44, t));
	const b = Math.round(lerp(0xc8, 0x55, t));
	return "rgb(" + r + "," + g + "," + b + ")";
}

function lerpGlow(t) {
	const r = Math.round(lerp(0, 255, t));
	const g = Math.round(lerp(255, 50, t));
	const b = Math.round(lerp(120, 70, t));
	return "rgba(" + r + "," + g + "," + b + ",0.28)";
}

function lerpTrailFill(t) {
	const r = Math.round(lerp(0, 255, t));
	const g = Math.round(lerp(255, 40, t));
	const b = Math.round(lerp(120, 60, t));
	return "rgba(" + r + "," + g + "," + b + ",0.12)";
}

function noise2d(x, y) {
	const s = Math.sin(x * 127.1 + y * 311.7 + radarCtl.seed) * 43758.5453;
	return (s - Math.floor(s)) * 2 - 1;
}

function skillPointsAt(time, hoverAmt) {
	const cx = radarCtl.cx;
	const cy = radarCtl.cy;
	const radius = radarCtl.radius;
	const n = radarCtl.nAxes;
	const pts = [];
	for (let i = 0; i < n; i++) {
		const base = radarCtl.baseValues[i];
		const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
		const n1 = noise2d(i * 1.7 + time * 1.4, time * 0.9);
		const n2 = noise2d(i * 2.3 - time * 1.1, i + time * 1.6);
		const radial = base + hoverAmt * 0.22 * n1;
		const t = Math.max(0.08, Math.min(1.05, radial));
		const tang = hoverAmt * 0.045 * radius * n2;
		const px = cx + radius * t * Math.cos(ang) - Math.sin(ang) * tang;
		const py = cy + radius * t * Math.sin(ang) + Math.cos(ang) * tang;
		pts.push([px, py]);
	}
	return pts;
}

function drawRadar() {
	const labels = SKILL_RADAR.labels;
	const values = SKILL_RADAR.values;
	const rings = SKILL_RADAR.rings;
	const radius = SKILL_RADAR.radius;
	const cx = SKILL_RADAR.cx;
	const cy = SKILL_RADAR.cy;
	const n = labels.length;
	const grid = document.getElementById("radar-grid");
	const area = document.getElementById("radar-area");
	const labG = document.getElementById("radar-labels");
	const svg = document.getElementById("skill-radar");
	const wrap = document.getElementById("skill-radar-wrap");
	if (!grid || !area || !labG || !svg) {
		return;
	}

	if (radarCtl.raf) {
		cancelAnimationFrame(radarCtl.raf);
		radarCtl.raf = 0;
	}

	["#radar-sweep-layer", "#radar-interfere-defs", "#radar-hex-jitter", "#radar-snow"].forEach(
		function (sel) {
			const el = svg.querySelector(sel);
			if (el) {
				el.remove();
			}
		}
	);

	grid.innerHTML = "";
	labG.innerHTML = "";
	radarCtl.dots = [];
	radarCtl.cx = cx;
	radarCtl.cy = cy;
	radarCtl.radius = radius;
	radarCtl.hover = 0;
	radarCtl.hoverTarget = 0;
	radarCtl.colorT = 0;

	function angleAt(i) {
		return -Math.PI / 2 + (i * 2 * Math.PI) / n;
	}

	function point(i, t) {
		const a = angleAt(i);
		return [cx + radius * t * Math.cos(a), cy + radius * t * Math.sin(a)];
	}

	const outerPts = Array.from({ length: n }, function (_, i) {
		return point(i, 1);
	});
	const outerPointsStr = outerPts
		.map(function (p) {
			return p.join(",");
		})
		.join(" ");

	for (let r = 1; r <= rings; r++) {
		const t = r / rings;
		const pts = Array.from({ length: n }, function (_, i) {
			return point(i, t).join(",");
		}).join(" ");
		const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
		poly.setAttribute("points", pts);
		poly.setAttribute("class", "radar-ring");
		grid.appendChild(poly);
	}

	for (let i = 0; i < n; i++) {
		const p = point(i, 1);
		const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line.setAttribute("x1", String(cx));
		line.setAttribute("y1", String(cy));
		line.setAttribute("x2", String(p[0]));
		line.setAttribute("y2", String(p[1]));
		line.setAttribute("class", "radar-axis");
		grid.appendChild(line);
	}

	const dataPts = values.map(function (v, i) {
		return point(i, Math.max(0, Math.min(100, v)) / 100);
	});

	radarCtl.baseValues = values.map(function (v) {
		return Math.max(0.05, Math.min(1, v / 100));
	});
	radarCtl.nAxes = n;
	radarCtl.areaEl = area;

	area.setAttribute(
		"points",
		dataPts
			.map(function (p) {
				return p.join(",");
			})
			.join(" ")
	);

	dataPts.forEach(function (p, i) {
		const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		c.setAttribute("cx", String(p[0]));
		c.setAttribute("cy", String(p[1]));
		c.setAttribute("r", "3.2");
		c.setAttribute("class", "radar-dot");
		c.dataset.angle = String(angleAt(i));
		labG.appendChild(c);
		radarCtl.dots.push(c);
	});

	labels.forEach(function (text, i) {
		const p = point(i, 1.2);
		const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
		t.setAttribute("x", String(p[0]));
		t.setAttribute("y", String(p[1]));
		t.setAttribute("class", "radar-label");
		t.textContent = text;
		labG.appendChild(t);
	});

	const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
	defs.setAttribute("id", "radar-interfere-defs");
	defs.innerHTML =
		'<clipPath id="radar-hex-clip">' +
		'<polygon points="' +
		outerPointsStr +
		'"/>' +
		"</clipPath>" +
		'<filter id="radar-interfere" x="-15%" y="-15%" width="130%" height="130%">' +
		'<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" seed="3">' +
		'<animate attributeName="baseFrequency" values="0.04;0.1;0.05;0.12;0.04" dur="0.35s" repeatCount="indefinite"/>' +
		"</feTurbulence>" +
		'<feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" id="radar-displace"/>' +
		"</filter>" +
		'<filter id="radar-snow-filter">' +
		'<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="snow"/>' +
		'<feColorMatrix type="matrix" values="0 0 0 0 0.7  0 0 0 0 1  0 0 0 0 0.7  0 0 0 0.5 0" in="snow"/>' +
		"</filter>";
	svg.insertBefore(defs, svg.firstChild);

	const snow = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	snow.setAttribute("id", "radar-snow");
	snow.setAttribute("x", String(cx - radius));
	snow.setAttribute("y", String(cy - radius));
	snow.setAttribute("width", String(radius * 2));
	snow.setAttribute("height", String(radius * 2));
	snow.setAttribute("clip-path", "url(#radar-hex-clip)");
	snow.setAttribute("filter", "url(#radar-snow-filter)");
	snow.setAttribute("opacity", "0");
	svg.appendChild(snow);

	const jitter = document.createElementNS("http://www.w3.org/2000/svg", "g");
	jitter.setAttribute("id", "radar-hex-jitter");
	area.parentNode.insertBefore(jitter, area);
	jitter.appendChild(area);
	jitter.appendChild(labG);

	const layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
	layer.setAttribute("id", "radar-sweep-layer");

	const trail = document.createElementNS("http://www.w3.org/2000/svg", "path");
	trail.setAttribute("class", "radar-sweep-trail");
	trail.setAttribute("fill", lerpTrailFill(0));
	layer.appendChild(trail);
	radarCtl.trail = trail;

	const glow = document.createElementNS("http://www.w3.org/2000/svg", "line");
	glow.setAttribute("x1", String(cx));
	glow.setAttribute("y1", String(cy));
	glow.setAttribute("x2", String(cx));
	glow.setAttribute("y2", String(cy - radius));
	glow.setAttribute("stroke", lerpGlow(0));
	glow.setAttribute("stroke-width", "10");
	glow.setAttribute("class", "radar-sweep-glow");
	layer.appendChild(glow);
	radarCtl.sweepGlow = glow;

	const sweep = document.createElementNS("http://www.w3.org/2000/svg", "line");
	sweep.setAttribute("class", "radar-sweep");
	sweep.setAttribute("x1", String(cx));
	sweep.setAttribute("y1", String(cy));
	sweep.setAttribute("x2", String(cx));
	sweep.setAttribute("y2", String(cy - radius));
	sweep.setAttribute("stroke", lerpColor(0));
	sweep.setAttribute("stroke-width", "2.5");
	sweep.setAttribute("stroke-linecap", "round");
	layer.appendChild(sweep);
	radarCtl.sweepLine = sweep;

	svg.appendChild(layer);

	if (wrap) {
		wrap.addEventListener("mouseenter", function () {
			radarCtl.hoverTarget = 1;
		});
		wrap.addEventListener("mouseleave", function () {
			radarCtl.hoverTarget = 0;
		});
	}

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (!reduced) {
		startRadarSweep();
	} else {
		radarCtl.dots.forEach(function (d) {
			d.classList.add("radar-dot-lit");
		});
	}
}

function radarTrailPath(cx, cy, r, angle, width) {
	const a0 = angle - width;
	const steps = 12;
	let d = "M " + cx + " " + cy;
	for (let i = 0; i <= steps; i++) {
		const a = a0 + (width * i) / steps;
		d += " L " + (cx + r * Math.cos(a)) + " " + (cy + r * Math.sin(a));
	}
	d += " Z";
	return d;
}

function startRadarSweep() {
	if (radarCtl.raf) {
		cancelAnimationFrame(radarCtl.raf);
	}
	radarCtl.paused = false;

	let last = performance.now();
	const hitWindow = 0.16;
	const trailWidth = 0.55;
	const hoverLerp = 3.2;
	const colorLerp = 2.8;

	function frame(now) {
		if (radarCtl.paused || document.hidden) {
			radarCtl.raf = requestAnimationFrame(frame);
			last = now;
			return;
		}

		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;

		radarCtl.hover += (radarCtl.hoverTarget - radarCtl.hover) * Math.min(1, hoverLerp * dt);
		radarCtl.colorT += (radarCtl.hoverTarget - radarCtl.colorT) * Math.min(1, colorLerp * dt);

		const speed = lerp(radarCtl.baseSpeed, radarCtl.hoverSpeed, radarCtl.hover);
		radarCtl.angle += speed * dt;
		while (radarCtl.angle > Math.PI) {
			radarCtl.angle -= Math.PI * 2;
		}

		const cx = radarCtl.cx;
		const cy = radarCtl.cy;
		const r = radarCtl.radius;
		const a = radarCtl.angle;
		const x2 = cx + r * Math.cos(a);
		const y2 = cy + r * Math.sin(a);
		const t = radarCtl.colorT;
		const noise = radarCtl.hover;

		const snow = document.getElementById("radar-snow");
		if (snow) {
			snow.setAttribute("opacity", noise.toFixed(3));
		}
		const displace = document.getElementById("radar-displace");
		if (displace) {
			displace.setAttribute("scale", String((noise * 14).toFixed(2)));
		}

		if (radarCtl.areaEl && radarCtl.baseValues.length) {
			const pts = skillPointsAt(now * 0.001, noise);
			radarCtl.areaEl.setAttribute(
				"points",
				pts
					.map(function (p) {
						return p[0].toFixed(2) + "," + p[1].toFixed(2);
					})
					.join(" ")
			);
			radarCtl.dots.forEach(function (dot, i) {
				if (pts[i]) {
					dot.setAttribute("cx", pts[i][0].toFixed(2));
					dot.setAttribute("cy", pts[i][1].toFixed(2));
				}
			});
		}

		if (radarCtl.sweepLine) {
			radarCtl.sweepLine.setAttribute("x2", String(x2));
			radarCtl.sweepLine.setAttribute("y2", String(y2));
			radarCtl.sweepLine.setAttribute("stroke", lerpColor(t));
		}
		if (radarCtl.sweepGlow) {
			radarCtl.sweepGlow.setAttribute("x2", String(x2));
			radarCtl.sweepGlow.setAttribute("y2", String(y2));
			radarCtl.sweepGlow.setAttribute("stroke", lerpGlow(t));
		}
		if (radarCtl.trail) {
			radarCtl.trail.setAttribute("d", radarTrailPath(cx, cy, r, a, trailWidth));
			radarCtl.trail.setAttribute("fill", lerpTrailFill(t));
		}

		radarCtl.dots.forEach(function (dot) {
			const da = parseFloat(dot.dataset.angle);
			let diff = Math.abs(a - da);
			if (diff > Math.PI) {
				diff = Math.PI * 2 - diff;
			}
			const lit = diff < hitWindow;
			dot.classList.toggle("radar-dot-lit", lit);
			dot.setAttribute("r", lit ? "5.5" : "3.2");
		});

		radarCtl.raf = requestAnimationFrame(frame);
	}

	radarCtl.raf = requestAnimationFrame(frame);
}

function setRadarPaused(p) {
	radarCtl.paused = !!p;
}
