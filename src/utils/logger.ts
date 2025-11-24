import env from "./env.js";

const colors = {
  reset: "\x1b[0m",
  grey: "\x1b[90m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
};

const timestamp = () =>
  new Date().toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const isProd = env.NODE_ENV === "production";

export const cLogger = {
  info: (...msg: unknown[]) => {
    console.info(
      `${colors.blue}[INFO ]${colors.reset} ${colors.grey}${timestamp()}${colors.reset} —`,
      ...msg,
    );
  },

  warn: (...msg: unknown[]) => {
    console.warn(
      `${colors.yellow}[WARN ]${colors.reset} ${colors.grey}${timestamp()}${colors.reset} —`,
      ...msg,
    );
  },

  error: (...msg: unknown[]) => {
    console.error(
      `${colors.red}[ERROR]${colors.reset} ${colors.grey}${timestamp()}${colors.reset} —`,
      ...msg,
    );
  },

  debug: (...msg: unknown[]) => {
    if (isProd) return;
    console.debug(
      `${colors.grey}[DEBUG]${colors.reset} ${colors.grey}${timestamp()}${colors.reset} —`,
      ...msg,
    );
  },

  log: (message: string, ...rest: string[]) => {
    console.log(
      `${colors.green}[ LOG ]${colors.reset} ${colors.grey}${timestamp()}${colors.reset} —`,
      message,
      ...rest,
    );
  },
};
