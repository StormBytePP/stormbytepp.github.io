const termUi = {
	append: null,
	clear: null,
	openShell: null,
	openPanic: null,
	openBoot: null,
	close: null,
	focusInput: null,
	isOpen: null,
};

const termHistory = {
	max: 50,
	items: [],
	index: -1,
	draft: "",
};

function termHistoryPush(line) {
	const s = String(line || "").trim();
	if (!s) {
		return;
	}
	if (
		termHistory.items.length &&
		termHistory.items[termHistory.items.length - 1] === s
	) {
		termHistory.index = termHistory.items.length;
		return;
	}
	termHistory.items.push(s);
	while (termHistory.items.length > termHistory.max) {
		termHistory.items.shift();
	}
	termHistory.index = termHistory.items.length;
	termHistory.draft = "";
}

function initTermUi() {
	const root = document.getElementById("sys-terminal");
	const log = document.getElementById("sys-terminal-log");
	const inputRow = document.getElementById("sys-terminal-input-row");
	const input = document.getElementById("sys-terminal-input");
	const title = document.getElementById("sys-terminal-title");
	const closeBtn = document.getElementById("sys-terminal-close");

	if (!root || !log) {
		console.error("sys-terminal DOM missing");
		return;
	}

	function setMode(mode) {
		root.classList.remove("mode-shell", "mode-panic", "mode-boot");
		if (mode) {
			root.classList.add("mode-" + mode);
		}
	}

	function show() {
		root.hidden = false;
	}

	function hide() {
		root.hidden = true;
		setMode(null);
		if (inputRow) {
			inputRow.hidden = true;
		}
	}

	termUi.isOpen = function () {
		return !root.hidden;
	};

	termUi.append = function (text) {
		log.textContent += String(text) + "\n";
		log.scrollTop = log.scrollHeight;
	};

	termUi.clear = function () {
		log.textContent = "";
	};

	termUi.focusInput = function () {
		if (input && inputRow && !inputRow.hidden) {
			setTimeout(function () {
				input.focus();
			}, 30);
		}
	};

	termUi.close = function () {
		hide();
		if (input) {
			input.value = "";
		}
	};

	termUi.openShell = function () {
		show();
		setMode("shell");
		if (title) {
			title.textContent = "tty1 — shell";
		}
		if (inputRow) {
			inputRow.hidden = false;
		}
		termUi.clear();
		termUi.append(
			"Gentoo Linux | Profile: StormByte:StormByte/glibc/desktop"
		);
		termUi.append("StormByte identity shell. Type 'help'.");
		termUi.append("");
		termUi.focusInput();
		return true;
	};

	termUi.openPanic = function () {
		show();
		setMode("panic");
		if (title) {
			title.textContent = "tty0 — KERNEL";
		}
		if (inputRow) {
			inputRow.hidden = true;
		}
		termUi.clear();
		return true;
	};

	termUi.openBoot = function () {
		show();
		setMode("boot");
		if (title) {
			title.textContent = "tty0 — BOOT";
		}
		if (inputRow) {
			inputRow.hidden = true;
		}
		termUi.clear();
		return true;
	};

	function closeShellFromUi() {
		if (typeof bfGame !== "undefined" && bfGame.active) {
			return;
		}
		if (!root.classList.contains("mode-shell")) {
			return;
		}
		termUi.close();
		document.dispatchEvent(new Event("shell-closed"));
	}

	if (closeBtn) {
		closeBtn.addEventListener("click", function () {
			if (
				root.classList.contains("mode-panic") ||
				root.classList.contains("mode-boot")
			) {
				return;
			}
			closeShellFromUi();
		});
	}

	if (input) {
		input.addEventListener("keydown", function (e) {
			if (e.key === "Enter") {
				e.preventDefault();
				const line = input.value;
				input.value = "";
				const waiting =
					typeof emergeState !== "undefined" && emergeState.pending;
				if (!waiting) {
					termHistoryPush(line);
				}
				if (termUi.append) {
					termUi.append(
						(waiting ? "" : "stormbyte@identity:~$ ") + line
					);
				}
				if (
					typeof emergeHandleConfirm === "function" &&
					emergeHandleConfirm(line)
				) {
					return;
				}
				if (typeof runShellCommand === "function") {
					runShellCommand(line);
				}
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				if (!termHistory.items.length) {
					return;
				}
				if (termHistory.index === termHistory.items.length) {
					termHistory.draft = input.value;
				}
				if (termHistory.index > 0) {
					termHistory.index -= 1;
				}
				input.value = termHistory.items[termHistory.index] || "";
				setTimeout(function () {
					input.setSelectionRange(
						input.value.length,
						input.value.length
					);
				}, 0);
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				if (!termHistory.items.length) {
					return;
				}
				if (termHistory.index < termHistory.items.length) {
					termHistory.index += 1;
				}
				if (termHistory.index >= termHistory.items.length) {
					termHistory.index = termHistory.items.length;
					input.value = termHistory.draft || "";
				} else {
					input.value = termHistory.items[termHistory.index] || "";
				}
				setTimeout(function () {
					input.setSelectionRange(
						input.value.length,
						input.value.length
					);
				}, 0);
			} else if (e.key === "Escape" || e.key === "Esc") {
				if (typeof bfGame !== "undefined" && bfGame.active) {
					return;
				}
				e.preventDefault();
				closeShellFromUi();
			}
		});
	}

	document.addEventListener(
		"keydown",
		function (e) {
			if (e.key !== "Escape" && e.key !== "Esc") {
				return;
			}
			if (typeof bfGame !== "undefined" && bfGame.active) {
				return;
			}
			if (!termUi.isOpen() || !root.classList.contains("mode-shell")) {
				return;
			}
			e.preventDefault();
			closeShellFromUi();
		},
		true
	);

	root.addEventListener("click", function (e) {
		if (e.target === root && root.classList.contains("mode-shell")) {
			closeShellFromUi();
		}
	});
}
