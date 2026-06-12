type LogLevel = "INFO" | "WARN" | "ERR" | "TEST";
type LogSystem = "SYSTEM" | "SERVER" | "DATA" | "TEST" | "WORLD" | "CHAR";

export default class Logger {
  private readonly system: LogSystem;

  private static readonly hexConfig = {
    levels: {
      INFO: "#F5D77F",
      WARN: "#F39C12",
      ERR:  "#E74C3C",
      TEST: "#2ECC71"
    },
    systems: {
      SYSTEM: "#BBBBBB",
      SERVER: "#2BC2FC",
      DATA:   "#E91E63",
      TEST:   "#b2d128",
      WORLD:  "#7AE6B5",
      CHAR:   "#d6ac11"
    }
  };

  private static readonly colors = new Map<LogLevel, string>();
  private static readonly systemColors = new Map<LogSystem, string>();
  private static readonly resetColor = "\x1b[0m";

  private static maxSystemLength = 0;
  private static maxLevelLength = 0;

  private static readonly instantiatedSystems = new Set<LogSystem>();

  static {
    for (const [level, hex] of Object.entries(Logger.hexConfig.levels)) {
      Logger.colors.set(level as LogLevel, Logger.hexToAnsi(hex));
    }

    for (const [sys, hex] of Object.entries(Logger.hexConfig.systems)) {
      Logger.systemColors.set(sys as LogSystem, Logger.hexToAnsi(hex));
    }

    let maxLen = 0;
    for (const level of Logger.colors.keys()) {
      const tagLength = `[${level}]`.length;
      if (tagLength > maxLen) {
        maxLen = tagLength;
      }
    }
    Logger.maxLevelLength = maxLen;
  }

  constructor(system: LogSystem) {
    this.system = system;

    Logger.instantiatedSystems.add(system);

    let maxSys = 0;
    for (const sys of Logger.instantiatedSystems) {
      const tagLength = `[${sys}]`.length;
      if (tagLength > maxSys) {
        maxSys = tagLength;
      }
    }
    Logger.maxSystemLength = maxSys;
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

    const color = Logger.colors.get(level) ?? "";
    const levelString = `[${color}${level}${Logger.resetColor}]`;
    const colorOverhead = color.length + Logger.resetColor.length;
    const alignedLevel = levelString.padStart(Logger.maxLevelLength + colorOverhead, " ");

    const sysColor = Logger.systemColors.get(this.system) ?? "";
    const systemString = `[${sysColor}${this.system}${Logger.resetColor}]`;
    const sysColorOverhead = sysColor.length + Logger.resetColor.length;
    const alignedSystem = systemString.padStart(Logger.maxSystemLength + sysColorOverhead, " ");

    return `[${time}] ${alignedSystem} ${alignedLevel} ${message}`;
  }

  public info(message: string): void { console.log(this.format("INFO", message)); }
  public warn(message: string): void { console.log(this.format("WARN", message)); }
  public error(message: string): void { console.log(this.format("ERR", message)); }
  public test(message: string): void { console.log(this.format("TEST", message)); }
}