const matrixCtl = {
	stop: null,
	start: null,
	setChaos: null,
	pause: null,
	resume: null,
};

function initMatrix() {
	const canvas = document.getElementById("matrix");
	const btn = document.getElementById("matrix-toggle");
	if (!canvas) {
		return;
	}

	const ctx = canvas.getContext("2d");
	let width = 0;
	let height = 0;
	let columns = 0;
	let drops = [];
	let timer = null;
	let chaos = false;
	let userEnabled = MATRIX.enabled;

	function resize() {
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		columns = Math.floor(width / MATRIX.fontSize);
		drops = Array.from({ length: columns }, function () {
			return Math.random() * height;
		});
	}

	function draw() {
		ctx.fillStyle = "rgba(0, 0, 0, " + MATRIX.fadeAlpha + ")";
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = "#0f0";
		ctx.font = MATRIX.fontSize + "px monospace";

		const maxS = chaos ? MATRIX.chaosMaxSpeed : MATRIX.maxSpeed;
		const minS = MATRIX.minSpeed;

		for (let i = 0; i < drops.length; i++) {
			const text = String.fromCharCode(0x30a0 + Math.random() * 96);
			ctx.fillText(text, i * MATRIX.fontSize, drops[i] * MATRIX.fontSize);
			if (drops[i] * MATRIX.fontSize > height && Math.random() > 0.975) {
				drops[i] = 0;
			}
			drops[i] += minS + Math.random() * (maxS - minS) * 0.15;
		}
	}

	function restartTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		if (!userEnabled || document.hidden) {
			return;
		}
		const ms = chaos ? MATRIX.chaosIntervalMs : MATRIX.intervalMs;
		timer = setInterval(draw, ms);
	}

	function stop() {
		userEnabled = false;
		MATRIX.enabled = false;
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		ctx.clearRect(0, 0, width, height);
		canvas.classList.add("matrix-off");
		if (btn) {
			btn.textContent = "Matrix: off";
			btn.setAttribute("aria-pressed", "false");
		}
	}

	function start() {
		userEnabled = true;
		MATRIX.enabled = true;
		canvas.classList.remove("matrix-off");
		if (btn) {
			btn.textContent = "Matrix: on";
			btn.setAttribute("aria-pressed", "true");
		}
		restartTimer();
	}

	matrixCtl.stop = stop;
	matrixCtl.start = start;
	matrixCtl.setChaos = function (on) {
		chaos = !!on;
		restartTimer();
	};
	matrixCtl.pause = function () {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	};
	matrixCtl.resume = function () {
		if (userEnabled && !timer) {
			restartTimer();
		}
	};

	resize();
	window.addEventListener("resize", resize);
	if (userEnabled) {
		restartTimer();
	} else {
		canvas.classList.add("matrix-off");
		if (btn) {
			btn.textContent = "Matrix: off";
			btn.setAttribute("aria-pressed", "false");
		}
	}

	if (btn) {
		btn.addEventListener("click", function () {
			if (userEnabled) {
				stop();
			} else {
				start();
			}
		});
	}
}
