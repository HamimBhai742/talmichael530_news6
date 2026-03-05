import express from "express";
import { UserControllers } from "./user.controller";

import { UserRoleEnum } from "@prisma/client";
import checkAuth from "../../middleware/checkAuth";
import { registerUser } from "./user.validation";
import validateRequest from "../../middleware/validateRequest";

const router = express.Router();

// get all user
router.get(
  "/",
  checkAuth(UserRoleEnum.ADMIN, UserRoleEnum.SUPERADMIN),
  UserControllers.getAllUsers,
);

// get single user
router.get(
  "/:id",
  checkAuth(UserRoleEnum.ADMIN, UserRoleEnum.SUPERADMIN, UserRoleEnum.USER),
  UserControllers.getSingleUser,
);

// register
router.post(
  "/register",
  validateRequest(registerUser),
  UserControllers.register,
);

// user update
router.put(
  "/update",
  checkAuth(UserRoleEnum.USER, UserRoleEnum.ADMIN),
  UserControllers.updateUser,
);

//  my profile
router.get(
  "/profile/me",
  checkAuth(UserRoleEnum.USER, UserRoleEnum.ADMIN, UserRoleEnum.SUPERADMIN),
  UserControllers.getProfile,
);

// 1️⃣ Request OTP
router.post("/password/request-otp", UserControllers.requestPasswordReset);

// 2️⃣ Verify OTP
router.post("/password/verify-otp", UserControllers.verifyOtp);

// 3️⃣ Reset Password
router.post("/password/reset", UserControllers.resetPassword);

router.put(
  "/twoFactor/authentication",
  checkAuth(UserRoleEnum.ADMIN, UserRoleEnum.SUPERADMIN, UserRoleEnum.USER),
  UserControllers.updateTwoFactorAuthentication,
);

router.delete(
  "/delete/:id",
  checkAuth(UserRoleEnum.ADMIN, UserRoleEnum.SUPERADMIN),
  UserControllers.deleteUser,
);

export const UserRouters = router;
