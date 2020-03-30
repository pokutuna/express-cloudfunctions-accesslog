@pokutuna/requestlog-cloudfunctions
===

[![Actions Status](https://github.com/pokutuna/requestlog-cloudfunctions/workflows/test/badge.svg)](https://github.com/pokutuna/requestlog-cloudfunctions/actions)
[![npm (scoped)](https://img.shields.io/npm/v/@pokutuna/requestlog-cloudfunctions)](https://www.npmjs.com/package/@pokutuna/requestlog-cloudfunctions)

A middleware to write an `httpRequest` log with `trace` field on Cloud Functions.

This makes it possible to group your application logs in an HTTP request.

![log-grouping](./log-grouping.png)

## Usage

```ts
import express = require("express");
import { logHttpRequest } from "@pokutuna/requestlog-cloudfunctions";

const projectId = "<YOUR_PROJECT_ID>";
const logId = "request_log";

const app = express();
app.use(logHttpRequest({ projectId, logId }));
...
```

### Options

- `projectId`
  - default: `process.env.GCLOUD_PROJECT`
  - You must give `projectId` on nodejs10 runtime which doesn't provide `GCLOUD_PROJECT` environment variable.
- `logId`
  - default: `"request_log"`
  - Logs are written to logName `projects/{projectId}/logs/{logId}` on Stackdriver Logging

## Writing logs

- (Recommend) use `@google-cloud/logging-winston` or `@google-cloud/logging-bunyan`
  - see [Setting Up Stackdriver Logging for Node.js  |  Stackdriver Logging  |  Google Cloud](https://cloud.google.com/logging/docs/setup/nodejs)
  - These libraries provide `req.log(...)` method considering the trace field.
- Or write the `trace` field by yourself.
  - The `X-Cloud-Trace-Context` request header contains `${traceId}/${spanId}`
  - Write `trace` field with `projects/${projectId}/traces/${traceId}` in metadata of a entry using the client library `@google-cloud/logging`.
  ```js
  const { Logging } = require("@google-cloud/logging");
  
  const projectId = "<YOUR_PROJECT_ID>";
  const logging = new Logging({ projectId });
  const log = logging.log("application_log");

  exports.app = (req, res) => {
    const [traceId] = req.header("X-Cloud-Trace-Context").split("/");
    const trace = `projects/${projectId}/traces/${traceId}`;

    // log.entry(metadata, data)
    const entry = log.entry(
      { trace },
      { message: "this is a message", obj: { key: "value" } }
    );
    await log.write(entry);
  };
  ```
