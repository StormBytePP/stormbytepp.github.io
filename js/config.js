const MAIL = {
	user: "stormbyte",
	domain: "gmail.com",
};

function mailAddress() {
	return MAIL.user + "@" + MAIL.domain;
}

function mailTo(subject, body) {
	const q =
		"subject=" + encodeURIComponent(subject) +
		"&body=" + encodeURIComponent(body);
	return "mailto:" + mailAddress() + "?" + q;
}

const MATRIX = {
	enabled: true,
	fontSize: 16,
	minSpeed: 1.2,
	maxSpeed: 14,
	fadeAlpha: 0.08,
	intervalMs: 50,
	chaosIntervalMs: 12,
	chaosMaxSpeed: 40,
};

const BCD = {
	rotateMs: 4500,
	fastMs: 333,
	opcodeBytes: 4,
	addrBytes: 8,
	tokenWidth: 8,
	dataTokens: [
		"STORMBYT",
		"BUILDMAS",
		"STAGEMAN",
		"GITHUB--",
		"DATABASE",
		"LOGGER--",
		"MULTIMED",
		"CRYPTO--",
		"CONFIG--",
		"NETWORK-",
		"SYSTEM--",
		"BUFFER--",
		"STORMCAC",
		"POSTGRES",
		"XHTMLOMA",
		"VIDEOCNV",
	],
};

const SKILL_RADAR = {
	labels: ["C++", "SYSTEMS", "ALGORITHMS", "PERFORMANCE", "ARCHITECTURE", "DEBUGGING"],
	values: [92, 95, 88, 85, 87, 94],
	rings: 4,
	radius: 100,
	cx: 160,
	cy: 150,
};

const SKILL_CHIPS = [
	{ id: "hub", label: "C++23", icon: "C++", hub: true, x: 50, y: 50 },
	{ id: "tl", label: "Bash", icon: ">_", x: 18, y: 18 },
	{ id: "tr", label: "CMake", icon: "</>", x: 82, y: 18 },
	{ id: "ml", label: "PostgreSQL", icon: "PG", x: 14, y: 50 },
	{ id: "mr", label: "Git", icon: "◆", x: 86, y: 50 },
	{ id: "bl", label: "Gentoo", icon: "g", x: 22, y: 82 },
	{ id: "br", label: "Nginx", icon: "N", x: 78, y: 82 },
	{ id: "bc", label: "Elixir", icon: "Ex", x: 50, y: 88 },
];

const SKILL_FX = {
	packetCount: 72,
	packetShareHub: 0.38,
	packetShareElixir: 0.28,
	packetSharePeer: 0.28,
	packetShareEdge: 0.06,
	packetDurationMin: 1.6,
	packetDurationMax: 3.2,
	packetW: 7,
	packetH: 2,
	respectReducedMotion: true,
	resizeDebounceMs: 120,
	busLines: 5,
	busLinesElixir: 6,
	busLinesPeer: 5,
	busSpacing: 3.0,
	edgeOvershoot: 22,
	edgeLines: 4,
	pinsPerSide: 5,
	glowMinMs: 2800,
	glowMaxMs: 7000,
	glowHoldMs: 400,
};

const WAVE = {
	fps: 40,
	points: 200,
	speed: 0.09,
	baseAmp: 14,
	audio: {
		bassAmp: 7,
		midAmp: 5.5,
		highAmp: 3.2,
		noiseAmp: 4.5,
		spikeChance: 0.045,
		spikeAmp: 12,
		dropChance: 0.03,
		envelopeSpeed: 0.7,
		roughness: 1.35,
	},
	panic: {
		ampScale: 1.35,
		noiseAmp: 11,
		spikeChance: 0.22,
		spikeAmp: 22,
		dropChance: 0.12,
		speedScale: 2.8,
		jitter: 3.5,
	},
	exciteMs: 1400,
	exciteBoost: 1.45,
};

const BOOT = {
	panicMs: 2200,
	panicLineDelayMs: 70,
	blackoutMs: 280,
	bootLineDelayMs: 95,
	componentStaggerMs: 320,
	readyHoldMs: 800,
	panicLines: [
		"Kernel panic - not syncing: Fatal exception in interrupt",
		"CPU: 0 PID: 1 Comm: init Not tainted 6.x-stormbyte #1",
		"Hardware name: StormByte Identity Fabric",
		"RIP: 0010:pcb_trace_walk+0x42/0x80",
		"Call Trace:",
		" skill_radar_draw+0x1c",
		" bcd_rotate+0x2a",
		" matrix_rain_tick+0x55",
		" panic_notifier_call+0x10",
		"---[ end Kernel panic - not syncing: Fatal exception in interrupt ]---",
	],
	bootLines: [
		"[    0.000000] StormByte EFI v1.0.0 — cold reset after panic",
		"[    0.000180] CPU0: C++23 host online, SMT enabled",
		"[    0.000920] ACPI: identity fabric tables loaded",
		"[    0.001640] Memory: scrubbing BUFFER pools… OK",
		"[    0.002410] PCI: rescanning northbridge / southbridge links",
		"[    0.003200] NVMe: revalidating cache volumes (ccache/sccache)",
		"[    0.004050] net: restoring stack, link negotiation… UP",
		"[    0.004880] storage: zram/tmpfs workspaces remounted",
		"[    0.005720] crypto: AEAD engines online (AES-GCM / ChaCha20)",
		"[    0.006500] irq: rebalancing vectors after hard fault",
		"[    0.007280] watchdog: soft-lockup detector re-armed",
		"[    0.008100] StormByte Rescue Utils: attaching diagnostic probes",
		"[    0.008950] StormByte Rescue Utils: replaying last stable PCB graph",
		"[    0.009780] StormByte Rescue Utils: radar / BCD fabric checksum OK",
		"[    0.010600] StormByte Rescue Utils: fail-fast paths cleared",
		"[    0.011400] Initiating StormByte Rescue Utils…",
		"[    0.012200] userspace: identity shell may resume",
	],
	mailtoSubject: "Contact from portfolio (after PANIC)",
	mailtoBody: "Hi David,\n\nI hit PANIC on your portfolio and survived the reboot.\n\n",
};

const SHELL = {
	idleMs: 5 * 60 * 1000,
	photoClicks: 3,
	mailtoSubject: "Contact from portfolio terminal",
	mailtoBody: "Hi David,\n\nI found the terminal on your portfolio.\n\n",
};