/*!
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// edited by pokutuna from
// https://github.com/googleapis/nodejs-logging/blob/263e046603fb8dc105653b860f4936add4c45f71/src/middleware/express/make-middleware.ts

import * as onFinished from 'on-finished';
import {
  makeHeaderWrapper,
  getOrInjectContext,
} from '@google-cloud/logging/build/src/middleware/context';
import { makeHttpRequestData } from '@google-cloud/logging/build/src/middleware/express/make-http-request';
import { StackdriverHttpRequest } from '@google-cloud/logging/build/src/http-request';
import { Request, Response, NextFunction } from 'express';

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
