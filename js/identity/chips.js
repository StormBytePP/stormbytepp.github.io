function escapeHtml(s) {
	return String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function renderChips() {
	const host = document.getElementById("skill-chips");
	if (!host) {
		return;
	}
	const n = SKILL_FX.pinsPerSide;

	function pinRow(side) {
		const pins = Array.from({ length: n }, function () {
			return '<span class="pin"></span>';
		}).join("");
		return '<div class="chip-pins chip-pins-' + side + '">' + pins + "</div>";
	}

	host.innerHTML = SKILL_CHIPS.map(function (c) {
		const hubClass = c.hub ? " chip-hub" : "";
		return (
			'<div class="skill-chip' +
			hubClass +
			'" id="chip-' +
			c.id +
			'" style="--x:' +
			c.x +
			"%; --y:" +
			c.y +
			'%;" data-chip-id="' +
			c.id +
			'">' +
			pinRow("left") +
			pinRow("right") +
			pinRow("top") +
			pinRow("bottom") +
			'<span class="chip-icon">' +
			escapeHtml(c.icon || "") +
			"</span>" +
			'<span class="chip-label">' +
			escapeHtml(c.label) +
			"</span></div>"
		);
	}).join("");

	host.querySelectorAll(".skill-chip").forEach(function (el) {
		el.addEventListener("click", function () {
			if (typeof exciteWave === "function") {
				exciteWave();
			}
		});
	});
}

function initChipGlow(reduced) {
	if (reduced) {
		return;
	}
	document.querySelectorAll(".skill-chip").forEach(function (chip) {
		function loop() {
			const wait =
				SKILL_FX.glowMinMs +
				Math.random() * (SKILL_FX.glowMaxMs - SKILL_FX.glowMinMs);
			setTimeout(function () {
				chip.classList.add("chip-hot");
				setTimeout(function () {
					chip.classList.remove("chip-hot");
					loop();
				}, SKILL_FX.glowHoldMs);
			}, wait);
		}
		loop();
	});
}
