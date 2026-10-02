function boot() {
	initYear();
	initAge();
	initTypewriter();
	initNav();
	initMailLinks();
	initGpg();
	initIdentity();
	initSysStatus();
	initVisibilityPause();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot);
} else {
	boot();
}
