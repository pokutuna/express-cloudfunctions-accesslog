import { Logging, LoggingOptions, Log } from '@google-cloud/logging';
import { LogOptions } from '@google-cloud/logging/build/src/log';

import { makeMiddleware } from './make-middleware';
export interface LogHttpRequestOptions extends LoggingOptions, LogOptions {
  projectId?: string;
  logId?: string;
}

export function logHttpRequest(options: LogHttpRequestOptions) {
  const projectId = options.projectId || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error('projectId or GCLOUD_PROJECT must be provided.');
  }

  const logging = new Logging(options);
  const logName = Log.formatName_(projectId, options.logId || 'request_log');
  const log = logging.log(logName, options);

  return makeMiddleware(projectId, (httpRequest, trace) => {
    const entry = logging.entry({ trace, httpRequest });
    log.write(entry);
  });
}
