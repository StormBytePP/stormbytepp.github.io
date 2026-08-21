const TRACE_GAME = {
	/* board */
	size: 8,
	levels: 99,                 // practically unlimited – game ends by packets

	/* packet motion + lives */
	speed0: 0.36,
	speedGrowth: 1.18,
	solveSpeedMult: 11,
	packetsToWin: 1,            // packets needed to clear ONE level
	startingPackets: 3,         // lives at the start of a session
	dataStartDelayMs: 2800,

	/* banners */
	faultExitMs: 2600,
	winPulseMs: 2200,

	/* soft visual hint */
	pathHint: true,
	pathHintOpacity: 0.30,

	/* locks */
	lockTraversed: true,

	/* generation – interesting paths */
	fixedTileRatio: 0.12,
	pathJitter: true,
	minPathLength: 14,
	minTurns: 6,
	minSpan: 5,
	maxPathAttempts: 120,
	scrambleRatio: 0.72,

	/* visual filler */
	pieceWeights: {
		straight: 0.40,
		elbow: 0.45,
		dead: 0.15,
	},

	/* rotate animation */
	rotateLiftMs: 90,
	rotateSpinMs: 160,
	rotateSeatMs: 80,
	rotateLiftScale: 1.12,

	/* layout */
	cellPx: 52,
	gapPx: 3,

	/* UI */
	hint: "Click a tile to rotate · Link DATA_IN → DATA_OUT before the bus faults",
	msgWinTitle: "LINK ESTABLISHED — PAYLOAD DELIVERED",
	msgWinSub: "end-to-end path verified",
	msgFaultTitle: "BUS FAULT — SIGNAL LOST",
	msgFaultSub: "payload dropped at segment",
	title: "tty — TRACE REPAIR",
	subtitle: "BUS FABRIC",
};
