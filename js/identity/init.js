function initIdentity() {
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (typeof initBcd === "function") {
		initBcd(reduced);
	}
	if (typeof drawRadar === "function") {
		drawRadar();
	}
	if (typeof initCircuit === "function") {
		initCircuit(reduced);
	} else if (typeof buildCircuit === "function") {
		buildCircuit(reduced);
	}
	if (typeof initWave === "function") {
		initWave(reduced);
	}
}

window.addEventListener("resize", function () {
	/* circuit redraws itself; radar is static geometry */
});
