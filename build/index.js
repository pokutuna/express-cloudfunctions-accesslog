"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const onFinished = require("on-finished");
const logging_1 = require("@google-cloud/logging");
const context_1 = require("@google-cloud/logging/build/src/middleware/context");
const make_http_request_1 = require("@google-cloud/logging/build/src/middleware/express/make-http-request");
// from https://github.com/googleapis/nodejs-logging/blob/master/src/middleware/express/make-middleware.ts
// - add parameters to httpRequest
// - don't need childLogger
function makeMiddleware(projectId, emitRequestLog) {
    return (req, res, next) => {
        const requestStartMs = Date.now();
        const wrapper = context_1.makeHeaderWrapper(req);
        const spanContext = context_1.getOrInjectContext(wrapper);
        const trace = `projects/${projectId}/traces/${spanContext.traceId}`;
        onFinished(res, () => {
            const latencyMs = Date.now() - requestStartMs;
            const httpRequest = make_http_request_1.makeHttpRequestData(req, res, latencyMs);
            emitRequestLog(Object.assign({ remoteIp: req.ip, referer: req.headers['referer'] }, httpRequest), trace);
        });
        next();
    };
}
exports.makeMiddleware = makeMiddleware;
function logHttpRequest(options) {
    const projectId = options.projectId || process.env.GCLOUD_PROJECT;
    if (!projectId) {
        throw new Error('projectId or GCLOUD_PROJECT must be provided.');
    }
    const logging = new logging_1.Logging(options);
    const logName = logging_1.Log.formatName_(projectId, options.logId || 'request_log');
    const log = logging.log(logName, options);
    return makeMiddleware(projectId, (httpRequest, trace) => {
        const entry = logging.entry({ trace, httpRequest });
        log.write(entry);
    });
}
exports.logHttpRequest = logHttpRequest;
//# sourceMappingURL=index.js.map