/*
 * Copyright 2024 bakduo Licensed under MIT
 * See license text at https://mit-license.org/license.txt
 */

const childProcess = require("child_process");
const dotenv = require("dotenv");
const stream = require("stream");
const path = require("path");
// Environment variables
const cwd = process.cwd();
const { env } = process;
const logPath = cwd + "/log";
//Fin logger
let port = process.env.PORT || 64890;

dotenv.config({
  path: path.resolve(cwd + "/config/", process.env.NODE_ENV + ".env"),
});

let mode = process.env.MODE || "testing";

if (mode != "testing") {
  const child = childProcess.spawn(
    process.execPath,
    [
      require.resolve("pino-tee"),
      "warn",
      `${logPath}/log.warn.log`,
      "error",
      `${logPath}/log.error.log`,
      "info",
      `${logPath}/log.info.log`,
      "debug",
      `${logPath}/log.debug.log`,
    ],
    { cwd, env },
  );

  const logThrough = new stream.PassThrough();

  logThrough.pipe(child.stdin);

  const logger = require("pino")(
    {
      name: "signal-server",
      customLevels: ["error", "info", "debug"],
    },
    logThrough,
  );

  module.exports = {
    logger,
    port,
  };
} else {
  const logger = require("pino")({
    name: "signal-server",
    customLevels: ["error", "info", "debug"],
  });

  module.exports = {
    logger,
    port,
  };
}
