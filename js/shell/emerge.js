const emergeState = {
	installed: false,
	pending: null,
};

function emergeOut(line) {
	if (typeof termUi !== "undefined" && termUi.append) {
		termUi.append(line);
	}
}

function sleepEmerge(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

function parseEmergeArgs(args) {
	const flags = {
		oneshot: false,
		pretend: false,
		ask: false,
		verbose: false,
		update: false,
		deep: false,
		newuse: false,
		search: false,
		sync: false,
		info: false,
	};
	const pkgs = [];

	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a === "--sync") {
			flags.sync = true;
			continue;
		}
		if (a === "--info") {
			flags.info = true;
			continue;
		}
		if (a === "--search" || a === "-s") {
			flags.search = true;
			continue;
		}
		if (a === "--oneshot" || a === "-1") {
			flags.oneshot = true;
			continue;
		}
		if (a === "--pretend" || a === "-p") {
			flags.pretend = true;
			continue;
		}
		if (a === "--ask" || a === "-a") {
			flags.ask = true;
			continue;
		}
		if (a === "--verbose" || a === "-v") {
			flags.verbose = true;
			continue;
		}
		if (a === "--update" || a === "-u") {
			flags.update = true;
			continue;
		}
		if (a === "--deep" || a === "-D") {
			flags.deep = true;
			continue;
		}
		if (a === "--newuse" || a === "-N") {
			flags.newuse = true;
			continue;
		}
		if (a.charAt(0) === "-" && a.charAt(1) !== "-") {
			const body = a.slice(1);
			for (let j = 0; j < body.length; j++) {
				const ch = body.charAt(j);
				if (ch === "1") {
					flags.oneshot = true;
				} else if (ch === "p") {
					flags.pretend = true;
				} else if (ch === "a") {
					flags.ask = true;
				} else if (ch === "v") {
					flags.verbose = true;
				} else if (ch === "u") {
					flags.update = true;
				} else if (ch === "D") {
					flags.deep = true;
				} else if (ch === "N") {
					flags.newuse = true;
				} else if (ch === "s") {
					flags.search = true;
				}
			}
			continue;
		}
		if (a.charAt(0) !== "-") {
			pkgs.push(a);
		}
	}
	return { flags: flags, pkgs: pkgs };
}

function emergeIsWorld(pkg) {
	const p = String(pkg || "").toLowerCase();
	return p === "world" || p === "@world" || p === "system" || p === "@system";
}

function emergeIsBusfabric(pkg) {
	const p = String(pkg || "").toLowerCase().replace(/^[=<>~]+/, "");
	return (
		p === "busfabric" ||
		p === "games-puzzle/busfabric" ||
		p === "stormbyte/busfabric" ||
		p.indexOf("busfabric") >= 0
	);
}

function emergeIsInstalled() {
	return !!emergeState.installed;
}

function emergeHandleConfirm(line) {
	if (!emergeState.pending) {
		return false;
	}
	const ans = String(line || "").trim().toLowerCase();
	const pending = emergeState.pending;
	emergeState.pending = null;

	if (ans === "" || ans === "y" || ans === "yes") {
		pending.resolve(true);
	} else if (ans === "n" || ans === "no") {
		emergeOut("Quitting.");
		emergeOut("");
		pending.resolve(false);
	} else {
		emergeOut("Please enter yes or no. [Yes/No]");
		emergeState.pending = pending;
	}
	return true;
}

function emergeAwaitAsk() {
	return new Promise(function (resolve) {
		emergeOut("Would you like to merge these packages? [Yes/No]");
		emergeState.pending = { resolve: resolve };
	});
}

async function emergeSync() {
	emergeOut(">>> Starting sync...");
	await sleepEmerge(350);
	emergeOut(">>> Syncing repository 'gentoo' into '/var/db/repos/gentoo'...");
	await sleepEmerge(400);
	emergeOut(
		">>> Syncing repository 'StormByte' into '/var/db/repos/StormByte'..."
	);
	await sleepEmerge(300);
	emergeOut("=== Sync completed for gentoo");
	emergeOut("=== Sync completed for StormByte");
	emergeOut(">>> All repositories already up to date.");
	emergeOut("");
}

async function emergeSearch(term) {
	const t = String(term || "").toLowerCase();
	emergeOut("[ Results for search key : " + (term || "*") + " ]");
	emergeOut("[ Applications found : 1 ]");
	emergeOut("");
	if (
		!t ||
		t === "*" ||
		"busfabric".indexOf(t) >= 0 ||
		t.indexOf("bus") >= 0
	) {
		emergeOut("*  games-puzzle/busfabric");
		emergeOut("      Latest version available: 1.0.0");
		emergeOut(
			"      Latest version installed: " +
				(emergeState.installed ? "1.0.0" : "[ Not Installed ]")
		);
		emergeOut("      Size of files: 384 KiB");
		emergeOut("      Homepage:      https://dev.stormbyte.org/");
		emergeOut("      Description:   PCB bus-routing puzzle (TRACE REPAIR)");
		emergeOut("      License:       GPL-2");
	} else {
		emergeOut("No matches found.");
	}
	emergeOut("");
}

function emergePlanLines() {
	emergeOut("");
	emergeOut("These are the packages that would be merged, in order:");
	emergeOut("");
	emergeOut("Calculating dependencies... done!");
	emergeOut("Dependency resolution took 0.62 s (backtrack: 0/20).");
	emergeOut("");
	emergeOut(
		"[ebuild  N     ] games-puzzle/busfabric-1.0.0::StormByte  USE=\"svg -debug\" 384 KiB"
	);
	emergeOut("");
	emergeOut("Total: 1 package (1 new), Size of downloads: 384 KiB");
	emergeOut("");
}

async function emergeDoMerge(flags) {
	emergeOut(">>> Verifying ebuild manifests");
	await sleepEmerge(280);
	emergeOut("");
	emergeOut(">>> Emerging (1 of 1) games-puzzle/busfabric-1.0.0::StormByte");
	await sleepEmerge(320);
	emergeOut(
		" * busfabric-1.0.0.tar.xz BLAKE2B SHA512 size ;-) ...                    [ ok ]"
	);
	await sleepEmerge(250);
	emergeOut(
		' * Source directory (CMAKE_USE_DIR): "/tmp/portage/games-puzzle/busfabric-1.0.0/work/busfabric-1.0.0"'
	);
	emergeOut(
		' * Build directory  (BUILD_DIR):     "/tmp/portage/games-puzzle/busfabric-1.0.0/work/busfabric-1.0.0_build"'
	);
	await sleepEmerge(200);
	emergeOut(
		"cmake -G Ninja -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=RelWithDebInfo ..."
	);
	await sleepEmerge(280);
	emergeOut("-- The CXX compiler identification is Clang 21.1.8");
	emergeOut("-- Configuring done (0.4s)");
	emergeOut("-- Generating done (0.0s)");
	await sleepEmerge(220);
	emergeOut("ninja -j32");
	emergeOut("[12/12 (100%)] Linking CXX executable busfabric");
	await sleepEmerge(300);
	emergeOut(">>> Installing (1 of 1) games-puzzle/busfabric-1.0.0::StormByte");
	await sleepEmerge(250);
	emergeOut(" * checking 4 files for package collisions");
	emergeOut(">>> Merging games-puzzle/busfabric-1.0.0 to /");
	emergeOut(">>> /usr/bin/busfabric");
	emergeOut(">>> /usr/share/busfabric/");
	emergeOut(">>> games-puzzle/busfabric-1.0.0 merged.");
	emergeOut("");
	emergeOut(">>> Completed (1 of 1) games-puzzle/busfabric-1.0.0::StormByte");
	emergeOut("");
	if (flags.oneshot) {
		emergeOut('>>> oneshot: not recording in "world" favorites');
	} else {
		emergeOut(
			'>>> Recording games-puzzle/busfabric in "world" favorites ...'
		);
	}
	emergeOut("");
	emergeOut(
		">>> Jobs: 1 of 1 complete                           Load avg: 0.42, 0.38, 0.31"
	);
	emergeOut("");

	emergeState.installed = true;

	emergeOut(" * games-puzzle/busfabric installed.");
	emergeOut(" * Run:  play          — or —  busfabric");
	emergeOut("");
}

async function emergeInstallBusfabric(flags) {
	if (emergeState.installed && !flags.pretend) {
		emergeOut("");
		emergeOut("Calculating dependencies... done!");
		emergeOut(
			"[ebuild   R    ] games-puzzle/busfabric-1.0.0::StormByte  USE=\"svg -debug\" 0 KiB"
		);
		emergeOut("");
		emergeOut("Total: 1 package (1 reinstall), Size of downloads: 0 KiB");
		emergeOut("");
		if (flags.ask) {
			const ok = await emergeAwaitAsk();
			if (!ok) {
				return;
			}
		}
		emergeOut(">>> Reinstalling games-puzzle/busfabric-1.0.0::StormByte");
		await sleepEmerge(200);
		emergeOut(">>> games-puzzle/busfabric-1.0.0 merged.");
		emergeOut("");
		emergeOut(" * Run:  play          — or —  busfabric");
		emergeOut("");
		return;
	}

	emergePlanLines();

	if (flags.pretend) {
		return;
	}

	if (flags.ask) {
		const ok = await emergeAwaitAsk();
		if (!ok) {
			return;
		}
	}

	await emergeDoMerge(flags);
}

async function emergeWorld(flags) {
	emergePlanLines();
	if (flags.pretend) {
		return;
	}
	if (flags.ask) {
		const ok = await emergeAwaitAsk();
		if (!ok) {
			return;
		}
	}
	await emergeDoMerge({ oneshot: false, ask: false, pretend: false });
}

async function runEmerge(args) {
	const parsed = parseEmergeArgs(args || []);
	const flags = parsed.flags;
	const pkgs = parsed.pkgs;

	if (flags.sync) {
		await emergeSync();
		return;
	}

	if (flags.search) {
		await emergeSearch(pkgs[0] || "");
		return;
	}

	if (flags.info && pkgs[0]) {
		if (emergeIsBusfabric(pkgs[0])) {
			emergeOut("games-puzzle/busfabric-1.0.0::StormByte");
			emergeOut("    Homepage:    https://dev.stormbyte.org/");
			emergeOut("    Description: PCB bus-routing puzzle (TRACE REPAIR)");
			emergeOut("    License:     GPL-2");
		} else {
			emergeOut(
				'emerge: there are no ebuilds to satisfy "' + pkgs[0] + '"'
			);
		}
		return;
	}

	if (!pkgs.length && (flags.update || flags.deep || flags.newuse)) {
		await emergeWorld(flags);
		return;
	}

	if (!pkgs.length) {
		emergeOut("emerge: please specify a package or @world");
		return;
	}

	const target = pkgs[0];
	if (emergeIsWorld(target)) {
		await emergeWorld(flags);
		return;
	}
	if (emergeIsBusfabric(target)) {
		await emergeInstallBusfabric(flags);
		return;
	}

	emergeOut(
		'emerge: there are no ebuilds to satisfy "' + target + '".'
	);
	emergeOut(
		'  (dependency required by "' + target + '" [argument])'
	);
}
