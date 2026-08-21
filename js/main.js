function boot() {
	initYear();
	initAge();
	initTypewriter();
	initNav();
	initMailLinks();
	initMatrix();
	initGpg();
	initIdentity();
	if (typeof initShell === "function") {
		initShell();
	} else {
		console.error("initShell is not defined — check js/shell/init.js");
	}
	initSysStatus();
	initVisibilityPause();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot);
} else {
	boot();
}
