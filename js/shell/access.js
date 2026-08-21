const shellCtl = {
	_locked: false,
	_busfabricLoading: null,
	_busfabricReady: false,
	lock: function () {
		shellCtl._locked = true;
	},
	unlock: function () {
		shellCtl._locked = false;
	},
	isLocked: function () {
		return !!shellCtl._locked;
	},
};

function loadScript(src) {
	return new Promise(function (resolve, reject) {
		const existing = document.querySelector('script[data-bf="' + src + '"]');
		if (existing) {
			resolve();
			return;
		}
		const s = document.createElement("script");
		s.src = src;
		s.async = false;
		s.setAttribute("data-bf", src);
		s.onload = function () {
			resolve();
		};
		s.onerror = function () {
			reject(new Error("Failed to load " + src));
		};
		document.head.appendChild(s);
	});
}

function ensureBusFabric() {
	if (shellCtl._busfabricReady) {
		return Promise.resolve();
	}
	if (shellCtl._busfabricLoading) {
		return shellCtl._busfabricLoading;
	}
	const files = [
		"js/busfabric/config.js",
		"js/busfabric/pieces.js",
		"js/busfabric/board.js",
		"js/busfabric/render.js",
		"js/busfabric/game.js",
		"js/busfabric/init.js",
	];
	shellCtl._busfabricLoading = (async function () {
		for (let i = 0; i < files.length; i++) {
			await loadScript(files[i]);
		}
		shellCtl._busfabricReady = true;
		shellCtl._busfabricLoading = null;
		if (typeof initBusFabric === "function") {
			initBusFabric();
		}
	})();
	return shellCtl._busfabricLoading;
}

function tryOpenShell(opts) {
	opts = opts || {};
	if (shellCtl.isLocked()) {
		return false;
	}
	ensureBusFabric().catch(function (err) {
		console.error(err);
	});
	if (typeof termUi === "undefined" || !termUi.openShell) {
		return false;
	}
	const ok = termUi.openShell();
	if (ok && opts.neural && termUi.append) {
		termUi.append("(neural handshake complete)");
		termUi.append("");
	}
	return ok;
}

function forceOpenShellDom() {
	const root = document.getElementById("sys-terminal");
	if (root) {
		root.hidden = false;
		root.removeAttribute("hidden");
		root.style.display = "flex";
	}
	ensureBusFabric().catch(function (err) {
		console.error(err);
	});
	if (typeof termUi !== "undefined" && termUi.openShell) {
		termUi.openShell();
	}
}

function initShellAccess() {
	const photo = document.getElementById("profile-photo");
	let clicks = 0;
	let clickTimer = 0;
	if (photo) {
		photo.addEventListener("click", function () {
			clicks += 1;
			clearTimeout(clickTimer);
			clickTimer = setTimeout(function () {
				clicks = 0;
			}, 900);
			const need =
				typeof SHELL !== "undefined" && SHELL.photoClicks
					? SHELL.photoClicks
					: 3;
			if (clicks >= need) {
				clicks = 0;
				tryOpenShell({ neural: true });
			}
		});
	}

	const hint = document.querySelector(".tty-hint");
	if (hint) {
		hint.addEventListener("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (!tryOpenShell()) {
				forceOpenShellDom();
			}
		});
	}
}

function initShellIdle() {
	const ms =
		typeof SHELL !== "undefined" && SHELL.idleMs
			? SHELL.idleMs
			: 5 * 60 * 1000;
	let timer = 0;
	function bump() {
		clearTimeout(timer);
		timer = setTimeout(function () {
			if (!shellCtl.isLocked()) {
				tryOpenShell();
			}
		}, ms);
	}
	["mousemove", "keydown", "touchstart", "click"].forEach(function (ev) {
		document.addEventListener(ev, bump, { passive: true });
	});
	bump();
}
