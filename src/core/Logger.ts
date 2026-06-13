type LogLevel = "INFO" | "WARN" | "FAIL" | "DBUG";
type LogSystem = "SYST" | "SRVR" | "DATA" | "TEST" | "WRLD" | "CHAR";

class Logger {
  private readonly system: LogSystem;

  public static readonly hexConfig = {
    levels: {
      INFO:  "#F5D77F",
      WARN:  "#F39C12",
      FAIL: "#E74C3C", // Exactly 4 characters
      DBUG:  "#2ECC71"  // Industry standard 4-char debug
    },
    systems: {
      SYST: "#BBBBBB",
      SRVR: "#2BC2FC",
      DATA: "#E91E63",
      TEST: "#b2d128",
      WRLD: "#7AE6B5",
      CHAR: "#d6ac11"
    }
  };

  private static readonly resetColor = "\x1b[0m";
  private static readonly formattedLevels = new Map<LogLevel, string>();
  private static readonly formattedSystems = new Map<LogSystem, string>();

  static {
    // 1. Calculate maximum visual width for the system tag column
    let maxSysLen = 0;
    for (const sys of Object.keys(Logger.hexConfig.systems) as LogSystem[]) {
      maxSysLen = Math.max(maxSysLen, `[${sys}]`.length);
    }

    // 2. Calculate maximum visual width for the level tag column
    let maxLevelLen = 0;
    for (const level of Object.keys(Logger.hexConfig.levels) as LogLevel[]) {
      maxLevelLen = Math.max(maxLevelLen, `[${level}]`.length);
    }

    // 3. Pre-compile levels with external trailing spaces
    for (const level of Object.keys(Logger.hexConfig.levels) as LogLevel[]) {
      const hex = Logger.hexConfig.levels[level];
      const color = Logger.hexToAnsi(hex);

      const rawTag = `[${color}${level}${Logger.resetColor}]`;
      const visibleLength = `[${level}]`.length;
      const paddingSpaces = " ".repeat(maxLevelLen - visibleLength);

      // Pad externally so the bracket stays flush around the word
      Logger.formattedLevels.set(level, rawTag + paddingSpaces);
    }

    // 4. Pre-compile systems with leading external spaces for right-alignment
    for (const sys of Object.keys(Logger.hexConfig.systems) as LogSystem[]) {
      const hex = Logger.hexConfig.systems[sys];
      const color = Logger.hexToAnsi(hex);

      const rawTag = `[${color}${sys}${Logger.resetColor}]`;
      const visibleLength = `[${sys}]`.length;
      const paddingSpaces = " ".repeat(maxSysLen - visibleLength);

      Logger.formattedSystems.set(sys, paddingSpaces + rawTag);
    }
  }

  constructor(system: LogSystem) {
    this.system = system;
  }

  private static hexToAnsi(hex: string): string {
    const cleanHex = hex.replace("#", "");
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `\x1b[38;2;${r};${g};${b}m`;
  }

  private static getTimestamp(): string {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
  }

  private format(level: LogLevel, message: string): string {
    const time = Logger.getTimestamp();
    const alignedSystem = Logger.formattedSystems.get(this.system) ?? "";
    const alignedLevel = Logger.formattedLevels.get(level) ?? "";

    return `[${time}] ${alignedSystem} ${alignedLevel} ${message}`;
  }

  public info(message: string): void { console.log(this.format("INFO", message)); }
  public warn(message: string): void { console.log(this.format("WARN", message)); }
  public error(message: string): void { console.log(this.format("FAIL", message)); }
  public debug(message: string): void { console.log(this.format("DBUG", message)); }
}

type LogMethods = {
  INFO: (msg: string) => void;
  WARN: (msg: string) => void;
  ERROR: (msg: string) => void;
  DEBUG: (msg: string) => void;
};

// Map clean system names to the 4-char types on the exported container
const Log = {} as { [K in "SYSTEM" | "SERVER" | "DATA" | "TEST" | "WORLD" | "CHAR"]: LogMethods };

const systemMapping: Record<keyof typeof Log, LogSystem> = {
  SYSTEM: "SYST",
  SERVER: "SRVR",
  DATA:   "DATA",
  TEST:   "TEST",
  WORLD:  "WRLD",
  CHAR:   "CHAR"
};

for (const [cleanName, configName] of Object.entries(systemMapping) as [keyof typeof Log, LogSystem][]) {
  const loggerInstance = new Logger(configName);

  Log[cleanName] = {
    INFO:  (msg: string) => loggerInstance.info(msg),
    WARN:  (msg: string) => loggerInstance.warn(msg),
    ERROR: (msg: string) => loggerInstance.error(msg),
    DEBUG: (msg: string) => loggerInstance.debug(msg)
  };
}

export default Log;