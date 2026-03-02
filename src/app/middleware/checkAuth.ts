import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import AppError from "../error/AppError";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../utils/verifyToken";

const checkAuth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      const verifyUserToken = verifyToken(
        token,
        config.jwt.access_secret as Secret,
      );

      // Check user is exist
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id: verifyUserToken.id,
        },
      });

      if (!user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      req.user = { userId: verifyUserToken.id, verifyUserToken };
      if (roles.length && !roles.includes(verifyUserToken.role)) {
        throw new AppError(httpStatus.FORBIDDEN, "Forbidden!");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default checkAuth;
