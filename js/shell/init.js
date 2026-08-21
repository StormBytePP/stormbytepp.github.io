function initShell() {
	if (typeof initTermUi === "function") {
		initTermUi();
	}

	if (typeof termUi !== "undefined" && termUi.openShell) {
		const origOpen = termUi.openShell;
		termUi.openShell = function () {
			if (typeof shellCtl !== "undefined" && shellCtl.isLocked()) {
				return false;
			}
			ensureBusFabric().catch(function (err) {
				console.error(err);
			});
			return origOpen.apply(this, arguments);
		};
	}

	if (typeof initShellAccess === "function") {
		initShellAccess();
	}
	if (typeof initShellIdle === "function") {
		initShellIdle();
	}
}
