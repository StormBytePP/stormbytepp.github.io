(function () {
	const scripts = [
		"js/config.js",
		"js/matrix.js",
		"js/identity/bcd.js",
		"js/identity/radar.js",
		"js/identity/chips.js",
		"js/identity/circuit.js",
		"js/identity/wave.js",
		"js/identity/panic.js",
		"js/identity/init.js",
		"js/shell/terminal.js",
		"js/shell/emerge.js",
		"js/shell/commands.js",
		"js/shell/access.js",
		"js/shell/init.js",
		"js/ui.js",
		"js/main.js",
	];

	function loadOne(src) {
		return new Promise(function (resolve, reject) {
			const s = document.createElement("script");
			s.src = src;
			s.async = false;
			s.onload = function () {
				resolve();
			};
			s.onerror = function () {
				reject(new Error("Failed to load " + src));
			};
			document.head.appendChild(s);
		});
	}

	async function loadAll() {
		for (let i = 0; i < scripts.length; i++) {
			await loadOne(scripts[i]);
		}
	}

	loadAll().catch(function (err) {
		console.error(err);
	});
})();
