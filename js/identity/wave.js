const waveState = {
	t: 0,
	exciteUntil: 0,
	chaos: false,
	raf: 0,
	phase: [0, 0, 0, 0, 0],
	env: 1,
	envTarget: 1,
	paused: false,
};

function exciteWave() {
	waveState.exciteUntil = performance.now() + WAVE.exciteMs;
	const panel = document.getElementById("scope-panel");
	if (panel) {
		panel.classList.add("scope-excited");
	}
}

function setWaveChaos(on) {
	waveState.chaos = !!on;
	const panel = document.getElementById("scope-panel");
	if (panel) {
		if (on) {
			panel.classList.add("scope-excited");
		} else {
			panel.classList.remove("scope-excited");
		}
	}
}

function setWavePaused(p) {
	waveState.paused = !!p;
}

function initWave(reduced) {
	const poly = document.getElementById("scope-wave");
	if (!poly) {
		return;
	}
	if (reduced) {
		poly.setAttribute("points", "0,32 200,32");
		return;
	}

	const W = 200;
	const H = 64;
	const mid = H / 2;
	let last = 0;
	const frameMs = 1000 / WAVE.fps;

	function noise1(x) {
		const s = Math.sin(x * 127.1) * 43758.5453;
		return s - Math.floor(s);
	}

	function smoothNoise(x) {
		const i = Math.floor(x);
		const f = x - i;
		const u = f * f * (3 - 2 * f);
		return noise1(i) * (1 - u) + noise1(i + 1) * u;
	}

	function fbm(x, octaves) {
		let v = 0;
		let a = 0.5;
		let f = 1;
		for (let o = 0; o < octaves; o++) {
			v += a * (smoothNoise(x * f) * 2 - 1);
			f *= 2.03;
			a *= 0.5;
		}
		return v;
	}

	function sample(t, xNorm, panic) {
		const A = WAVE.audio;
		const P = WAVE.panic;
		const x = xNorm * 24 + t * 3.1;

		waveState.phase[0] += 0.07 + (panic ? 0.15 : 0);
		waveState.phase[1] += 0.13 + (panic ? 0.25 : 0);
		waveState.phase[2] += 0.21;
		waveState.phase[3] += 0.41 + (panic ? 0.3 : 0);

		if (Math.random() < 0.02) {
			waveState.envTarget = 0.35 + Math.random() * 0.9;
		}
		waveState.env += (waveState.envTarget - waveState.env) * 0.04 * A.envelopeSpeed;

		let y = 0;
		y += A.bassAmp * fbm(x * 0.35 + waveState.phase[0], 3) * waveState.env;
		y += A.midAmp * fbm(x * 1.1 + waveState.phase[1], 4) * (0.6 + 0.4 * waveState.env);
		y += A.highAmp * fbm(x * 3.4 + waveState.phase[2], 3);
		y += A.noiseAmp * A.roughness * (Math.random() - 0.5);
		y += A.noiseAmp * 0.55 * (smoothNoise(x * 8.7 + waveState.phase[3]) * 2 - 1);

		const spikeChance = panic ? P.spikeChance : A.spikeChance;
		const spikeAmp = panic ? P.spikeAmp : A.spikeAmp;
		if (Math.random() < spikeChance) {
			y += (Math.random() < 0.5 ? -1 : 1) * spikeAmp * (0.5 + Math.random());
		}

		const dropChance = panic ? P.dropChance : A.dropChance;
		if (Math.random() < dropChance) {
			y *= 0.15 + Math.random() * 0.25;
		}

		y *= WAVE.baseAmp / 12;

		if (panic) {
			y *= P.ampScale;
			y += P.noiseAmp * (Math.random() - 0.5);
			y += P.jitter * fbm(x * 6 + t * 9, 2);
			if (Math.random() < 0.08) {
				y = (Math.random() - 0.5) * 40;
			}
		}

		if (performance.now() < waveState.exciteUntil && !panic) {
			y *= WAVE.exciteBoost;
			y += (Math.random() - 0.5) * 6;
		}

		const limit = mid - 2;
		if (y > limit) {
			y = limit;
		}
		if (y < -limit) {
			y = -limit;
		}
		return y;
	}

	function frame(now) {
		if (waveState.paused || document.hidden) {
			waveState.raf = requestAnimationFrame(frame);
			return;
		}

		if (now - last >= frameMs) {
			last = now;
			const panic = waveState.chaos;
			const speed = WAVE.speed * (panic ? WAVE.panic.speedScale : 1);
			waveState.t += speed;

			if (!panic && now >= waveState.exciteUntil) {
				const panel = document.getElementById("scope-panel");
				if (panel) {
					panel.classList.remove("scope-excited");
				}
			}

			const pts = [];
			for (let i = 0; i < WAVE.points; i++) {
				const xNorm = i / (WAVE.points - 1);
				const x = xNorm * W;
				const y = mid + sample(waveState.t, xNorm, panic);
				pts.push(x.toFixed(2) + "," + y.toFixed(2));
			}
			poly.setAttribute("points", pts.join(" "));
		}
		waveState.raf = requestAnimationFrame(frame);
	}

	waveState.raf = requestAnimationFrame(frame);
}
