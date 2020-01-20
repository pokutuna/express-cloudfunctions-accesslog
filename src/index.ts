import * as onFinished from 'on-finished';
import { Logging, LoggingOptions, Log } from '@google-cloud/logging';
import { LogOptions } from '@google-cloud/logging/build/src/log';
import {
  makeHeaderWrapper,
  getOrInjectContext,
} from '@google-cloud/logging/build/src/middleware/context';
import { makeHttpRequestData } from '@google-cloud/logging/build/src/middleware/express/make-http-request';
import { StackdriverHttpRequest } from '@google-cloud/logging/build/src/http-request';
import { Request, Response, NextFunction } from 'express';

// from https://github.com/googleapis/nodejs-logging/blob/master/src/middleware/express/make-middleware.ts
// - add parameters to httpRequest
// - don't need childLogger
export function makeMiddleware(
  projectId: string,
  emitRequestLog: (httpRequest: StackdriverHttpRequest, trace: string) => void
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestStartMs = Date.now();

    const wrapper = makeHeaderWrapper(req);
    const spanContext = getOrInjectContext(wrapper);
    const trace = `projects/${projectId}/traces/${spanContext.traceId}`;

    onFinished(res, () => {
      const latencyMs = Date.now() - requestStartMs;
      const httpRequest = makeHttpRequestData(req, res, latencyMs);
      emitRequestLog(
        {
          remoteIp: req.ip,
          referer: req.headers['referer'],
          ...httpRequest,
        },
        trace
      );
    });

    next();
  };
}

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
