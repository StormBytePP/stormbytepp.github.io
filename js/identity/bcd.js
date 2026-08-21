const bcdState = {
	dataIndex: 0,
	dataTimer: null,
	fastTimer: null,
	chaosTimer: null,
	paint: null,
	paintFast: null,
	startChaos: null,
	stopChaos: null,
};

function initBcd(reduced) {
	const panel = document.getElementById("bcd-panel");
	const opcodeEl = document.getElementById("bcd-opcode");
	const addrEl = document.getElementById("bcd-addr");
	const dataEl = document.getElementById("bcd-data");
	if (!panel || !addrEl || !dataEl) {
		return;
	}

	function randomHexByte() {
		return Math.floor(Math.random() * 256)
			.toString(16)
			.toUpperCase()
			.padStart(2, "0");
	}

	function randomHexBytes(n) {
		let s = "";
		for (let i = 0; i < n; i++) {
			s += randomHexByte();
		}
		return s;
	}

	function padToken(s) {
		const t = String(s).toUpperCase().replace(/[^A-Z0-9\-]/g, "");
		if (t.length >= BCD.tokenWidth) {
			return t.slice(0, BCD.tokenWidth);
		}
		return t.padEnd(BCD.tokenWidth, "-");
	}

	function renderCells(host, text, groupEvery) {
		host.innerHTML = "";
		text.split("").forEach(function (ch, i) {
			if (groupEvery && i > 0 && i % groupEvery === 0) {
				const gap = document.createElement("span");
				gap.style.width = "0.3em";
				gap.setAttribute("aria-hidden", "true");
				host.appendChild(gap);
			}
			const cell = document.createElement("span");
			cell.className = "bcd-cell";
			cell.textContent = ch;
			host.appendChild(cell);
		});
	}

	function paintFast() {
		if (opcodeEl) {
			renderCells(opcodeEl, randomHexBytes(BCD.opcodeBytes), 2);
		}
		renderCells(addrEl, randomHexBytes(BCD.addrBytes), 2);
	}

	function paintData() {
		const tokens = [];
		for (let i = 0; i < 4; i++) {
			tokens.push(
				padToken(BCD.dataTokens[(bcdState.dataIndex + i) % BCD.dataTokens.length])
			);
		}
		renderCells(dataEl, tokens.join(""), BCD.tokenWidth);
	}

	function paint() {
		paintFast();
		paintData();
	}

	function paintChaos() {
		const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-";
		function rnd(n) {
			let s = "";
			for (let i = 0; i < n; i++) {
				s += alphabet[Math.floor(Math.random() * alphabet.length)];
			}
			return s;
		}
		if (opcodeEl) {
			renderCells(opcodeEl, rnd(BCD.opcodeBytes * 2), 2);
		}
		renderCells(addrEl, rnd(BCD.addrBytes * 2), 2);
		renderCells(dataEl, rnd(4 * BCD.tokenWidth), BCD.tokenWidth);
	}

	function advanceData() {
		bcdState.dataIndex = (bcdState.dataIndex + 1) % BCD.dataTokens.length;
		paintData();
		panel.classList.add("bcd-flash");
		setTimeout(function () {
			panel.classList.remove("bcd-flash");
		}, 280);
		if (typeof exciteWave === "function") {
			exciteWave();
		}
	}

	function tickFast() {
		paintFast();
		if (typeof exciteWave === "function" && Math.random() < 0.08) {
			exciteWave();
		}
	}

	bcdState.paint = paint;
	bcdState.paintFast = paintFast;
	paint();

	if (!reduced) {
		bcdState.fastTimer = setInterval(paintFast, BCD.fastMs);
		bcdState.dataTimer = setInterval(function () {
			bcdState.dataIndex = (bcdState.dataIndex + 1) % BCD.dataTokens.length;
			paintData();
		}, BCD.rotateMs);
	}

	if (opcodeEl) {
		opcodeEl.addEventListener("click", tickFast);
	}
	addrEl.addEventListener("click", tickFast);
	dataEl.addEventListener("click", advanceData);

	bcdState.startChaos = function () {
		panel.classList.add("bcd-chaos");
		if (bcdState.fastTimer) {
			clearInterval(bcdState.fastTimer);
			bcdState.fastTimer = null;
		}
		if (bcdState.dataTimer) {
			clearInterval(bcdState.dataTimer);
			bcdState.dataTimer = null;
		}
		if (bcdState.chaosTimer) {
			clearInterval(bcdState.chaosTimer);
		}
		bcdState.chaosTimer = setInterval(paintChaos, 40);
	};

	bcdState.stopChaos = function () {
		panel.classList.remove("bcd-chaos");
		if (bcdState.chaosTimer) {
			clearInterval(bcdState.chaosTimer);
			bcdState.chaosTimer = null;
		}
		paint();
		if (!reduced) {
			if (!bcdState.fastTimer) {
				bcdState.fastTimer = setInterval(paintFast, BCD.fastMs);
			}
			if (!bcdState.dataTimer) {
				bcdState.dataTimer = setInterval(function () {
					bcdState.dataIndex = (bcdState.dataIndex + 1) % BCD.dataTokens.length;
					paintData();
				}, BCD.rotateMs);
			}
		}
	};
}
