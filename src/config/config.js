/*
* Copyright 2022 bakduo Licensed under MIT
* Copyright 2019 bakduo. Licensed under MIT
* See license text at https://mit-license.org/license.txt
*/

const childProcess = require('child_process');
const dotenv = require('dotenv');
const stream = require('stream');
const path = require('path');
// Environment variables
const cwd = process.cwd();
const { env } = process;
const logPath = cwd + '/log';

dotenv.config({
  path: path.resolve(cwd + '/config/', process.env.NODE_ENV + '.env'),
});

const child = childProcess.spawn(
  process.execPath,
  [
    require.resolve('pino-tee'),
    'warn',
    `${logPath}/log.warn.log`,
    'error',
    `${logPath}/log.error.log`,
    'info',
    `${logPath}/log.info.log`,
    'debug',
    `${logPath}/log.debug.log`,
  ],
  { cwd, env }
);

const logThrough = new stream.PassThrough();

logThrough.pipe(child.stdin);

const logger = require('pino')(
  {
    name: 'signal-server',
    customLevels: ['error','info','debug']
  },
  logThrough
);
//Fin logger
port = process.env.PORT || 64890;

module.exports = {
    logger,
    port
}