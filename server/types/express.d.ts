/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextFunction, Request, Response } from 'express';
import type { User } from '../entity/User';

declare global {
  namespace Express {
    export interface Session {
      userId?: number;
    }

    export interface Request {
      user?: User;
    }
  }

  export type Middleware = <ParamsDictionary, any, any>(
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void | NextFunction> | void | NextFunction;
}
