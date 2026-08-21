function out(line) {
	if (typeof termUi !== "undefined" && termUi.append) {
		termUi.append(line);
	}
}

function sleepShell(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

const SHELL_FS = {
	cwd: "~",
	files: {
		"about.txt": true,
		"skills.txt": true,
		"projects.txt": true,
		"contact.url": true,
		README: true,
	},
};

function shellPathBase(p) {
	const s = String(p || "").replace(/\/+$/, "");
	const parts = s.split("/");
	return parts[parts.length - 1] || s;
}

function shellFileExists(name) {
	const base = shellPathBase(name);
	return !!SHELL_FS.files[base] || !!SHELL_FS.files[base.toLowerCase()];
}

function stormbyteIncident() {
	return (
		"stormbyte is not in the sudoers file.  This incident will be reported."
	);
}

function launchBusfabric() {
	if (typeof emergeIsInstalled !== "function" || !emergeIsInstalled()) {
		out("play: games-puzzle/busfabric is not installed");
		out("Try: emerge -1 busfabric");
		out("  or: emerge -s busfabric");
		return;
	}
	ensureBusFabric()
		.then(function () {
			if (typeof playTraceRepair === "function") {
				playTraceRepair();
			} else if (typeof startBusFabric === "function") {
				startBusFabric();
			} else {
				out("busfabric: runtime offline");
			}
		})
		.catch(function () {
			out("busfabric: failed to start");
		});
}

function runEselect(args) {
	const sub = (args[0] || "").toLowerCase();
	const action = (args[1] || "").toLowerCase();

	if (sub !== "profile") {
		out("  " + (args[0] || "") + " is not a valid module.");
		out("  Use 'eselect profile'.");
		return;
	}

	if (!action || action === "list") {
		const lines = [
			"Available profile symlink targets:",
			"  [1]   default/linux/amd64/23.0 (stable)",
			"  [2]   default/linux/amd64/23.0/systemd (stable)",
			"  [3]   default/linux/amd64/23.0/desktop (stable)",
			"  [4]   default/linux/amd64/23.0/desktop/systemd (stable)",
			"  [5]   default/linux/amd64/23.0/desktop/gnome (stable)",
			"  [6]   default/linux/amd64/23.0/desktop/gnome/systemd (stable)",
			"  [7]   default/linux/amd64/23.0/desktop/plasma (stable)",
			"  [8]   default/linux/amd64/23.0/desktop/plasma/systemd (stable)",
			"  [9]   default/linux/amd64/23.0/no-multilib (stable)",
			"  [10]  default/linux/amd64/23.0/no-multilib/systemd (stable)",
			"  [11]  default/linux/amd64/23.0/no-multilib/hardened (stable)",
			"  [12]  default/linux/amd64/23.0/no-multilib/hardened/systemd (stable)",
			"  [13]  default/linux/amd64/23.0/no-multilib/hardened/selinux (stable)",
			"  [14]  default/linux/amd64/23.0/no-multilib/hardened/selinux/systemd (stable)",
			"  [15]  default/linux/amd64/23.0/no-multilib/prefix (exp)",
			"  [16]  default/linux/amd64/23.0/no-multilib/prefix/kernel-2.6.32+ (exp)",
			"  [17]  default/linux/amd64/23.0/no-multilib/prefix/kernel-2.6.16+ (exp)",
			"  [18]  default/linux/amd64/23.0/no-multilib/prefix/kernel-3.2+ (exp)",
			"  [19]  default/linux/amd64/23.0/llvm (exp)",
			"  [20]  default/linux/amd64/23.0/llvm/systemd (exp)",
			"  [21]  default/linux/amd64/23.0/hardened (stable)",
			"  [22]  default/linux/amd64/23.0/hardened/systemd (stable)",
			"  [23]  default/linux/amd64/23.0/hardened/selinux (stable)",
			"  [24]  default/linux/amd64/23.0/hardened/selinux/systemd (stable)",
			"  [25]  default/linux/amd64/23.0/split-usr (stable)",
			"  [26]  default/linux/amd64/23.0/split-usr/desktop (stable)",
			"  [27]  default/linux/amd64/23.0/split-usr/desktop/gnome (stable)",
			"  [28]  default/linux/amd64/23.0/split-usr/desktop/plasma (stable)",
			"  [29]  default/linux/amd64/23.0/split-usr/no-multilib (stable)",
			"  [30]  default/linux/amd64/23.0/split-usr/no-multilib/selinux (stable)",
			"  [31]  default/linux/amd64/23.0/split-usr/no-multilib/hardened (stable)",
			"  [32]  default/linux/amd64/23.0/split-usr/no-multilib/hardened/selinux (stable)",
			"  [33]  default/linux/amd64/23.0/split-usr/no-multilib/prefix (exp)",
			"  [34]  default/linux/amd64/23.0/split-usr/no-multilib/prefix/kernel-2.6.32+ (exp)",
			"  [35]  default/linux/amd64/23.0/split-usr/no-multilib/prefix/kernel-2.6.16+ (exp)",
			"  [36]  default/linux/amd64/23.0/split-usr/no-multilib/prefix/kernel-3.2+ (exp)",
			"  [37]  default/linux/amd64/23.0/split-usr/llvm (exp)",
			"  [38]  default/linux/amd64/23.0/split-usr/hardened (stable)",
			"  [39]  default/linux/amd64/23.0/split-usr/hardened/selinux (stable)",
			"  [40]  default/linux/amd64/23.0/x32 (dev)",
			"  [41]  default/linux/amd64/23.0/x32/systemd (exp)",
			"  [42]  default/linux/amd64/23.0/split-usr/x32 (exp)",
			"  [43]  default/hurd/amd64/23.0 (exp)",
			"  [44]  default/linux/amd64/23.0/musl (dev)",
			"  [45]  default/linux/amd64/23.0/musl/systemd (dev)",
			"  [46]  default/linux/amd64/23.0/musl/llvm (exp)",
			"  [47]  default/linux/amd64/23.0/musl/llvm/systemd (exp)",
			"  [48]  default/linux/amd64/23.0/musl/hardened (exp)",
			"  [49]  default/linux/amd64/23.0/musl/hardened/systemd (exp)",
			"  [50]  default/linux/amd64/23.0/musl/hardened/selinux (exp)",
			"  [51]  default/linux/amd64/23.0/split-usr/musl (dev)",
			"  [52]  default/linux/amd64/23.0/split-usr/musl/llvm (exp)",
			"  [53]  default/linux/amd64/23.0/split-usr/musl/hardened (exp)",
			"  [54]  default/linux/amd64/23.0/split-usr/musl/hardened/selinux (exp)",
			"  [55]  StormByte:StormByte/glibc (stable)",
			"  [56]  StormByte:StormByte/glibc/desktop (stable) *",
			"  [57]  StormByte:StormByte/glibc/desktop/gnome (stable)",
			"  [58]  StormByte:StormByte/glibc/desktop/plasma (stable)",
			"  [59]  StormByte:StormByte/musl (stable)",
			"  [60]  StormByte:StormByte/musl/server (stable)",
		];
		lines.forEach(function (l) {
			out(l);
		});
		return;
	}

	if (action === "show") {
		out("Current profile:");
		out("  StormByte:StormByte/glibc/desktop (stable)");
		return;
	}

	if (action === "set") {
		out("eselect: profile set: Permission denied");
		return;
	}

	out("Usage: eselect profile list|show|set <target>");
}

function runShellCommand(raw) {
	const line = String(raw || "").trim();
	if (!line) {
		return;
	}

	const parts = line.split(/\s+/);
	const cmd = parts[0].toLowerCase();
	const args = parts.slice(1);

	switch (cmd) {
		case "help":
			out("Gentoo Linux | Profile: StormByte:StormByte/glibc/desktop");
			out("StormByte identity shell — restricted environment");
			out("  help, clear, whoami, id, uname, hostname, pwd, date");
			out("  ls, cat, head, tail, file, stat, tree");
			out("  rm, touch, mkdir, rmdir, cp, mv, chmod, chown");
			out("  cd, pushd, popd");
			out("  echo, printf, env, export, set, unset");
			out("  which, type, true, false, test, [, yes");
			out("  ps, top, kill, killall, free, df, du, uptime, history");
			out("  grep, find, wc, sort, uniq, diff");
			out("  ssh, scp, curl, wget, ping");
			out("  sudo, su, passwd, login");
			out("  emerge, eselect");
			out("  man, info");
			out("  about, skills, projects, contact");
			out("  exit | quit | logout");
			out("");
			break;

		case "clear":
		case "cls":
			if (termUi.clear) {
				termUi.clear();
			}
			break;

		case "whoami":
			out("stormbyte");
			break;

		case "id":
			out(
				"uid=1000(stormbyte) gid=1000(stormbyte) groups=1000(stormbyte),27(sudo)"
			);
			break;

		case "uname":
			if (args.indexOf("-a") >= 0 || args[0] === "-a") {
				out(
					"Linux identity 6.6.28-gentoo-StormByte #1 SMP PREEMPT_DYNAMIC x86_64 StormByte GNU/Linux"
				);
			} else {
				out("Linux");
			}
			break;

		case "hostname":
			out("identity");
			break;

		case "pwd":
			out("/home/stormbyte");
			break;

		case "date":
			out(new Date().toString());
			break;

		case "ls":
			shellLs(args);
			break;

		case "cat":
			if (!args[0]) {
				out("cat: missing file operand");
				break;
			}
			shellCat(args[0]);
			break;

		case "head":
		case "tail":
			if (!args[0] || (args[0].charAt(0) === "-" && !args[1])) {
				out(cmd + ": missing file operand");
				break;
			}
			shellCat(args[args.length - 1]);
			break;

		case "file":
			if (!args[0]) {
				out("file: missing operand");
				break;
			}
			shellFile(args[0]);
			break;

		case "stat":
			if (!args[0]) {
				out("stat: missing operand");
				break;
			}
			if (!shellFileExists(args[0])) {
				out(
					"stat: cannot statx '" +
						args[0] +
						"': No such file or directory"
				);
			} else {
				out("  File: " + args[0]);
				out(
					"  Size: 4096       Blocks: 8          IO Block: 4096   regular file"
				);
				out(
					"Access: (0644/-rw-r--r--)  Uid: ( 1000/stormbyte)   Gid: ( 1000/stormbyte)"
				);
			}
			break;

		case "tree":
			out(".");
			out("├── about.txt");
			out("├── skills.txt");
			out("├── projects.txt");
			out("├── contact.url");
			out("└── README");
			out("");
			out("0 directories, 5 files");
			break;

		case "rm":
			shellRm(args);
			break;

		case "touch":
		case "mkdir":
		case "rmdir":
		case "cp":
		case "mv":
		case "chmod":
		case "chown":
		case "ln":
			shellDeniedWrite(cmd, args);
			break;

		case "cd":
			shellCd(args);
			break;

		case "pushd":
		case "popd":
			out(cmd + ": restricted environment (stack disabled)");
			break;

		case "echo":
			out(args.join(" "));
			break;

		case "printf":
			out(args.join(" ").replace(/\\n/g, "\n"));
			break;

		case "env":
		case "export":
		case "set":
			out("USER=stormbyte");
			out("HOME=/home/stormbyte");
			out("SHELL=/bin/bash");
			out("TERM=xterm-256color");
			out("PATH=/usr/local/bin:/usr/bin:/bin");
			out("LANG=C.UTF-8");
			out("GENTOO_PROFILE=StormByte:StormByte/glibc/desktop");
			break;

		case "unset":
			break;

		case "which":
		case "type":
			if (!args[0]) {
				out(cmd + ": missing argument");
			} else {
				out(args[0] + " is a shell builtin or restricted command");
			}
			break;

		case "true":
			break;

		case "false":
			out("False.");
			break;

		case "test":
		case "[":
			out((cmd === "[" ? "[" : "test") + ": missing expression");
			break;

		case "yes":
			out("y");
			out("(yes: output limited in this environment)");
			break;

		case "ps":
			out("  PID TTY          TIME CMD");
			out("    1 ?        00:00:00 init");
			out("  428 pts/0    00:00:00 identity");
			out("  512 pts/0    00:00:00 bash");
			break;

		case "top":
		case "htop":
			out(cmd + ": interactive mode unavailable in this tty");
			break;

		case "kill":
		case "killall":
			out(cmd + ": operation not permitted");
			break;

		case "free":
			out(
				"               total        used        free      shared  buff/cache   available"
			);
			out(
				"Mem:        16384172     4200000     8100000      120000     4084172    11800000"
			);
			out("Swap:        2097148           0     2097148");
			break;

		case "df":
			out("Filesystem     1K-blocks    Used Available Use% Mounted on");
			out("/dev/root       41251136 12800000  26300000  33% /");
			out("tmpfs            8192086        0   8192086   0% /dev/shm");
			break;

		case "du":
			out("48\t.");
			break;

		case "uptime":
			out(
				" " +
					new Date().toTimeString().slice(0, 8) +
					" up 42 days,  3:14,  1 user,  load average: 0.42, 0.38, 0.31"
			);
			break;

		case "history":
			if (typeof termHistory !== "undefined" && termHistory.items) {
				termHistory.items.forEach(function (h, i) {
					out("  " + String(i + 1).padStart(4) + "  " + h);
				});
			}
			break;

		case "grep":
		case "find":
		case "wc":
		case "sort":
		case "uniq":
		case "diff":
		case "awk":
		case "sed":
			out(cmd + ": restricted environment (stdin closed)");
			break;

		case "ssh":
		case "scp":
		case "sftp":
			out(cmd + ": Network is unreachable");
			break;

		case "curl":
		case "wget":
			out(cmd + ": (6) Could not resolve host");
			break;

		case "ping":
			out("ping: socket: Operation not permitted");
			break;

		case "sudo":
			out(
				"We trust you have received the usual lecture from the local System"
			);
			out(
				"Administrator. It usually boils down to these three things:"
			);
			out("");
			out("    #1) Respect the privacy of others.");
			out("    #2) Think before you type.");
			out("    #3) With great power comes great responsibility.");
			out("");
			out(stormbyteIncident());
			break;

		case "su":
			out("Password: ");
			out("su: Authentication failure");
			break;

		case "passwd":
			out("Changing password for stormbyte.");
			out("Current password: ");
			out("passwd: Authentication token manipulation error");
			out("passwd: password unchanged");
			break;

		case "login":
			out(
				"login: restricted console — already authenticated as stormbyte"
			);
			break;

		case "eselect":
			runEselect(args);
			break;

		case "emerge":
			if (typeof runEmerge === "function") {
				runEmerge(args);
			} else {
				out("emerge: module offline");
			}
			break;

		case "man":
		case "info":
			if (!args[0]) {
				out("What manual page do you want?");
			} else {
				out(
					"No manual entry for " +
						args[0] +
						" (restricted environment; try 'help')"
				);
			}
			break;

		case "about":
			out("David Carlos Manuelda (StormByte)");
			out("Senior C++ / systems developer.");
			out("Libraries, toolchains, Gentoo stages, static graphs.");
			break;

		case "skills":
			if (typeof SKILL_RADAR !== "undefined") {
				for (let i = 0; i < SKILL_RADAR.labels.length; i++) {
					out(
						"  " +
							SKILL_RADAR.labels[i].padEnd(14) +
							" " +
							SKILL_RADAR.values[i]
					);
				}
			} else {
				out("radar offline");
			}
			break;

		case "projects":
			out("  StormByte (C++ suite)");
			out("  StormByte-BuildMaster");
			out("  StormByte-StageManager");
			out("  StormByte-GitHub");
			out("  StormByte-Database / Logger / Multimedia / Crypto …");
			break;

		case "contact":
			if (typeof mailTo === "function") {
				window.location.href = mailTo(
					SHELL && SHELL.mailtoSubject
						? SHELL.mailtoSubject
						: "Contact from portfolio terminal",
					SHELL && SHELL.mailtoBody
						? SHELL.mailtoBody
						: "Hi David,\n\n"
				);
			} else {
				out("mailto unavailable");
			}
			break;

		case "play":
		case "busfabric":
		case "trace":
			launchBusfabric();
			break;

		case "exit":
		case "quit":
		case "logout":
			if (termUi.close) {
				termUi.close();
			}
			document.dispatchEvent(new Event("shell-closed"));
			break;

		case "grok":
			out("still compiling the universe…");
			break;

		case "bash":
		case "sh":
		case "zsh":
			out(cmd + ": nested shells are not supported");
			break;

		case "vim":
		case "vi":
		case "nano":
		case "emacs":
			out(cmd + ": editing disabled in this environment");
			break;

		case "apt":
		case "apt-get":
		case "pacman":
		case "dnf":
		case "yum":
			out(cmd + ": read-only root filesystem");
			break;

		case "reboot":
		case "shutdown":
		case "poweroff":
		case "halt":
			out(cmd + ": Must be root.");
			break;

		default:
			out("bash: " + cmd + ": command not found");
			break;
	}
}

function shellLs(args) {
	const long = args.some(function (a) {
		return a.indexOf("l") >= 0 && a.charAt(0) === "-";
	});
	const names = [
		"about.txt",
		"skills.txt",
		"projects.txt",
		"contact.url",
		"README",
	];
	if (long) {
		out("total 20");
		names.forEach(function (n) {
			out("-rw-r--r-- 1 stormbyte stormbyte  4096 Aug 22 01:00 " + n);
		});
	} else {
		out(names.join("  "));
	}
}

function shellCat(name) {
	const n = String(name).toLowerCase();
	const base = shellPathBase(name);
	if (n === "about.txt" || n === "about") {
		runShellCommand("about");
		return;
	}
	if (n === "skills.txt" || n === "skills") {
		runShellCommand("skills");
		return;
	}
	if (n === "projects.txt" || n === "projects") {
		runShellCommand("projects");
		return;
	}
	if (n === "readme" || n === "readme.md") {
		out("StormByte identity fabric — interactive portfolio node.");
		out("Gentoo profile: StormByte:StormByte/glibc/desktop");
		out("Try: about | skills | projects | eselect profile list");
		return;
	}
	if (n === "contact.url" || n === "contact") {
		runShellCommand("contact");
		return;
	}
	if (shellFileExists(base)) {
		out("cat: " + name + ": Permission denied");
		return;
	}
	out("cat: " + name + ": No such file or directory");
}

function shellFile(name) {
	if (!shellFileExists(name)) {
		out(name + ": cannot open `" + name + "' (No such file or directory)");
		return;
	}
	out(name + ": ASCII text");
}

function shellRm(args) {
	if (!args.length) {
		out("rm: missing operand");
		out("Try 'rm --help' for more information.");
		return;
	}
	const tokens = args.map(function (a) {
		return a.toLowerCase();
	});
	const hasRf =
		tokens.indexOf("-rf") >= 0 ||
		tokens.indexOf("-fr") >= 0 ||
		(tokens.indexOf("-r") >= 0 && tokens.indexOf("-f") >= 0) ||
		tokens.some(function (t) {
			return (
				/^-[rf]*r[rf]*f[rf]*$/.test(t) ||
				/^-[rf]*f[rf]*r[rf]*$/.test(t)
			);
		});
	const targets = args.filter(function (a) {
		return a[0] !== "-";
	});
	const aimsAtRoot = targets.some(function (t) {
		return t === "/" || t === "/*";
	});
	if (hasRf && aimsAtRoot) {
		out("rm: nice try");
		return;
	}
	if (!targets.length) {
		out("rm: missing operand");
		return;
	}
	targets.forEach(function (t) {
		if (shellFileExists(t)) {
			out("rm: cannot remove '" + t + "': Permission denied");
		} else {
			out("rm: cannot remove '" + t + "': No such file or directory");
		}
	});
}

function shellDeniedWrite(cmd, args) {
	const targets = args.filter(function (a) {
		return a[0] !== "-";
	});
	if (!targets.length) {
		out(cmd + ": missing operand");
		return;
	}
	targets.forEach(function (t) {
		out(cmd + ": cannot create/affect '" + t + "': Permission denied");
	});
}

function shellCd(args) {
	const dest = args[0] || "~";
	if (
		dest === "~" ||
		dest === "." ||
		dest === "/home/stormbyte" ||
		dest === "$HOME"
	) {
		SHELL_FS.cwd = "~";
		return;
	}
	if (dest === ".." || dest === "/") {
		out("cd: restricted environment: cannot leave home");
		return;
	}
	out("bash: cd: " + dest + ": No such file or directory");
}
