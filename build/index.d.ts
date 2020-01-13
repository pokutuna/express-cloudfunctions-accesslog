import { LoggingOptions } from '@google-cloud/logging';
import { LogOptions } from '@google-cloud/logging/build/src/log';
import { StackdriverHttpRequest } from '@google-cloud/logging/build/src/http-request';
import { Request, Response } from 'express';
export declare function makeMiddleware(projectId: string, emitRequestLog: (httpRequest: StackdriverHttpRequest, trace: string) => void): (req: Request<import("express-serve-static-core").ParamsDictionary>, res: Response, next: Function) => void;
export interface LogHttpRequestOptions extends LoggingOptions, LogOptions {
    projectId?: string;
    logId?: string;
}
export declare function logHttpRequest(options: LogHttpRequestOptions): (req: Request<import("express-serve-static-core").ParamsDictionary>, res: Response, next: Function) => void;
