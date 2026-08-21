function initYear() {
	const el = document.getElementById("year");
	if (el) {
		el.textContent = String(new Date().getFullYear());
	}
}

function initAge() {
	const el = document.getElementById("age");
	if (!el) {
		return;
	}
	const born = new Date(1984, 3, 23);
	const now = new Date();
	let age = now.getFullYear() - born.getFullYear();
	const m = now.getMonth() - born.getMonth();
	if (m < 0 || (m === 0 && now.getDate() < born.getDate())) {
		age--;
	}
	el.textContent = String(age);
}

function initTypewriter() {
	const el = document.querySelector(".typewriter");
	if (!el) {
		return;
	}
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduced) {
		el.style.borderRight = "none";
		return;
	}
	const text = el.textContent;
	el.textContent = "";
	let i = 0;
	function tick() {
		if (i < text.length) {
			el.textContent += text.charAt(i);
			i++;
			setTimeout(tick, 45 + Math.random() * 40);
		} else {
			el.style.borderRight = "none";
		}
	}
	tick();
}

function initNav() {
	const toggle = document.querySelector(".toggle-button");
	const links = document.querySelector(".nav-links");
	if (toggle && links) {
		toggle.addEventListener("click", function () {
			const open = links.classList.toggle("active");
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
		});
		links.querySelectorAll("a").forEach(function (a) {
			a.addEventListener("click", function () {
				links.classList.remove("active");
				toggle.setAttribute("aria-expanded", "false");
			});
		});
	}
	document.querySelectorAll(".dropdown").forEach(function (dd) {
		const btn = dd.querySelector(".dropbtn");
		if (!btn) {
			return;
		}
		btn.addEventListener("click", function (e) {
			if (window.matchMedia("(max-width: 768px)").matches) {
				e.preventDefault();
				dd.classList.toggle("open");
			}
		});
	});
}

function initMailLinks() {
	const addr = mailAddress();
	document.querySelectorAll("#contact-email").forEach(function (a) {
		a.href = "mailto:" + addr;
		a.textContent = addr;
	});
}

function initGpg() {
	const btn = document.getElementById("gpg-toggle");
	const block = document.getElementById("gpg-block");
	if (!btn || !block) {
		return;
	}
	let loaded = false;
	btn.addEventListener("click", async function () {
		if (block.hidden) {
			if (!loaded) {
				try {
					const res = await fetch("StormByte.asc");
					if (!res.ok) {
						throw new Error("fetch failed");
					}
					block.textContent = await res.text();
					loaded = true;
				} catch (err) {
					block.textContent =
						"(Could not load StormByte.asc — open the Download link or serve over HTTP.)";
				}
			}
			block.hidden = false;
			btn.textContent = "Hide key";
		} else {
			block.hidden = true;
			btn.textContent = "Show key";
		}
	});
}

function initSysStatus() {
	const el = document.getElementById("sys-status");
	if (!el) {
		return;
	}
	const t0 = Date.now();
	function fmt(s) {
		const h = String(Math.floor(s / 3600)).padStart(2, "0");
		const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
		const sec = String(s % 60).padStart(2, "0");
		return h + ":" + m + ":" + sec;
	}
	setInterval(function () {
		const s = Math.floor((Date.now() - t0) / 1000);
		el.textContent = "uptime " + fmt(s) + " · load ok";
	}, 1000);
}

function initVisibilityPause() {
	document.addEventListener("visibilitychange", function () {
		const hide = document.hidden;
		if (matrixCtl.pause && matrixCtl.resume) {
			if (hide) {
				matrixCtl.pause();
			} else {
				matrixCtl.resume();
			}
		}
		if (typeof setRadarPaused === "function") {
			setRadarPaused(hide);
		}
		if (typeof setWavePaused === "function") {
			setWavePaused(hide);
		}
	});
}
