const liveCtl = {
	busy: false,
};

function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

function setLivePower(on) {
	const bcd = document.getElementById("bcd-panel");
	const radar = document.getElementById("skill-radar-wrap");
	const circuit = document.getElementById("skill-circuit-wrap");
	const scope = document.getElementById("scope-panel");
	if (on) {
		if (bcd) {
			bcd.classList.remove("bcd-off");
		}
		if (radar) {
			radar.classList.remove("radar-off");
		}
		if (circuit) {
			circuit.classList.remove("circuit-off");
		}
		if (scope) {
			scope.classList.remove("scope-off");
		}
		if (matrixCtl.start) {
			matrixCtl.start();
		}
	} else {
		if (bcd) {
			bcd.classList.add("bcd-off");
		}
		if (radar) {
			radar.classList.add("radar-off");
		}
		if (circuit) {
			circuit.classList.add("circuit-off");
		}
		if (scope) {
			scope.classList.add("scope-off");
		}
		if (matrixCtl.stop) {
			matrixCtl.stop();
		}
	}
}

function setLinkChaos(on) {
	const led = document.getElementById("link-led");
	if (led) {
		led.classList.toggle("link-chaos", !!on);
	}
}

async function runPanicSequence() {
	if (liveCtl.busy) {
		return;
	}
	liveCtl.busy = true;

	const btn = document.getElementById("panic-btn");
	if (btn) {
		btn.classList.add("is-pressed");
		btn.disabled = true;
	}

	if (shellCtl.lock) {
		shellCtl.lock();
	}

	setLinkChaos(true);
	if (matrixCtl.setChaos) {
		matrixCtl.setChaos(true);
	}
	if (bcdState.startChaos) {
		bcdState.startChaos();
	}
	if (typeof setWaveChaos === "function") {
		setWaveChaos(true);
	}

	if (termUi.openPanic) {
		termUi.openPanic();
	}
	for (let i = 0; i < BOOT.panicLines.length; i++) {
		termUi.append(BOOT.panicLines[i]);
		await sleep(BOOT.panicLineDelayMs);
	}
	await sleep(BOOT.panicMs);

	if (matrixCtl.setChaos) {
		matrixCtl.setChaos(false);
	}
	if (bcdState.stopChaos) {
		bcdState.stopChaos();
	}
	if (typeof setWaveChaos === "function") {
		setWaveChaos(false);
	}
	setLivePower(false);
	if (termUi.close) {
		termUi.close();
	}
	await sleep(BOOT.blackoutMs);

	if (termUi.openBoot) {
		termUi.openBoot();
	}
	for (let i = 0; i < BOOT.bootLines.length; i++) {
		termUi.append(BOOT.bootLines[i]);
		if (i % 3 === 2) {
			setLivePower(true);
			await sleep(BOOT.componentStaggerMs);
			if (i < BOOT.bootLines.length - 3) {
				setLivePower(false);
			}
		}
		await sleep(BOOT.bootLineDelayMs);
	}
	setLivePower(true);
	termUi.append("");
	termUi.append(":SYSTEM READY");
	await sleep(BOOT.readyHoldMs);
	if (termUi.close) {
		termUi.close();
	}

	window.location.href = mailTo(BOOT.mailtoSubject, BOOT.mailtoBody);

	setLinkChaos(false);
	if (btn) {
		btn.classList.remove("is-pressed");
		btn.disabled = false;
	}
	if (shellCtl.unlock) {
		shellCtl.unlock();
	}
	liveCtl.busy = false;
}

function initPanic() {
	const btn = document.getElementById("panic-btn");
	if (!btn) {
		return;
	}
	btn.addEventListener("click", function () {
		runPanicSequence();
	});
}
