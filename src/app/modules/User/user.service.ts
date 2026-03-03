import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import { generateOtp } from "../../utils/generateOtp";
import { otpQueueEmail } from "../../bullMQ/init";
import { generateToken } from "../../utils/generateToken";
import config from "../../../config";
import { Secret } from "jsonwebtoken";

interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  fcmToken?: string;
}

const registerUser = async (payload: UserPayload) => {
  const plainPassword = payload.password;
  const hashedPassword: string = await bcrypt.hash(plainPassword, 12);

  // 3️⃣ Duplicate check
  // TODO  check in cash memory
  console.time("findUserByEmail");
  const existingUser = await prisma.user.findFirst({
    where: { email: payload?.email },
  });
  console.timeEnd("findUserByEmail");
  if (existingUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User already exists!");
  }

  // 4️⃣ Generate OTP + expiry
  const otp = generateOtp(5);
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // 5️⃣ User create (status = PENDING / inactive initially)
  const newUser = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      name: `${payload.firstName} ${payload.lastName}`,
      email: payload.email,
      password: hashedPassword,
      fcmToken: payload.fcmToken || null,
      twoFactor: true,
      twoFactorOTP: otp,
      twoFactorOTPExpires: expiry,
    },
  });

 await otpQueueEmail.add(
    "registrationOtp",
    {
      email: newUser.email,
      otpCode: otp,
      userName: newUser.name,
      subject: "Your Verification OTP"
    },
    {
      jobId: `${newUser?.id}-${Date.now()}`,
      removeOnComplete: true,
      delay: 0,
      backoff: 5000,
      attempts: 3,
      removeOnFail: true,
    },
  );

  return {
    message:
      "Verification OTP sent to your email. Please verify to activate account.",
  };
};

const requestPasswordReset = async (email: string) => {
  if (!email) throw new AppError(httpStatus.BAD_REQUEST, "Email is required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    throw new AppError(httpStatus.NOT_FOUND, "No user found with this email");

  const otp = generateOtp(5); // 5-digit OTP
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const tempToken = generateToken(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    "5m",
  );

  await prisma.user.update({
    where: { email },
    data: {
      otp,
      otpExpiry,
      forgetPasswordToken: tempToken,
      forgetPasswordTokenExpires: otpExpiry,
    },
  });
  await otpQueueEmail.add(
    "passwordResetRequest",
    {
      userName: user.name,
      email: user.email,
      subject: "Password Reset Request",
      otpCode: otp,
    },
    {
      jobId: `${user.id}-${Date.now()}`,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
  );

  return { message: "OTP sent to email", tempToken };
};

const verifyOtp = async (email: string, otp: string, token: string) => {
  if (!email || !otp || !token)
    throw new AppError(httpStatus.BAD_REQUEST, "All fields are required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    throw new AppError(httpStatus.NOT_FOUND, "No user found with this email");

  if (user.otp !== otp)
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  if (!user.forgetPasswordToken || user.forgetPasswordToken !== token)
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired token");
  if (
    user.forgetPasswordTokenExpires &&
    user.forgetPasswordTokenExpires < new Date()
  )
    throw new AppError(httpStatus.BAD_REQUEST, "Token expired");

  // ✅ Generate new temporary token for password reset
  const newTempToken = generateToken(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    config.jwt.access_secret as Secret,
    "5m",
  );

  // ✅ Update user with new token and expiry
  const newExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await prisma.user.update({
    where: { email },
    data: {
      forgetPasswordToken: newTempToken,
      forgetPasswordTokenExpires: newExpiry,
    },
  });

  return {
    message: "OTP verified successfully",
    tempToken: newTempToken,
  };
};

const resetPassword = async (
  email: string,
  token: string,
  newPassword: string,
) => {
  if (!email || !token || !newPassword)
    throw new AppError(httpStatus.BAD_REQUEST, "All fields are required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    throw new AppError(httpStatus.NOT_FOUND, "No user found with this email");

  if (!user.forgetPasswordToken || user.forgetPasswordToken !== token)
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired token");
  if (
    user.forgetPasswordTokenExpires &&
    user.forgetPasswordTokenExpires < new Date()
  )
    throw new AppError(httpStatus.BAD_REQUEST, "Token expired");

  // ✅ Ensure password is not empty before hashing
  if (!newPassword.trim())
    throw new AppError(httpStatus.BAD_REQUEST, "Password cannot be empty");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
      forgetPasswordToken: null,
      forgetPasswordTokenExpires: null,
    },
  });
  await otpQueueEmail.add(
    "passwordChangedConfirmation",
    {
      userName: user.lastName,
      email: user.email,
      subject: "Password Changed Successfully",
      secureLink: `${config.client_url}/secure-account`,
    },
    {
      jobId: `${user.id}-${Date.now()}`,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
  );
  return { message: "Password reset successfully" };
};

const getProfile = async (id: string) => {
  const result = await prisma.user.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      number: true,
      skill: true,
      email: true,
      address: true,
      image: true,
    },
  });

  return result;
};

const getAllUsers = async () => {
  const result = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      number: true,
      skill: true,
      email: true,
      address: true,
      image: true,
    },
  });

  return result;
};

const getSingleUser = async (id: string) => {
  const result = await prisma.user.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      number: true,
      skill: true,
      email: true,
      address: true,
      image: true,
    },
  });

  return result;
};

const updateUser = async (id: string, payload: any) => {
  const result = await prisma.user.update({
    where: { id },
    data: {
      ...payload,
    },
  });

  return { id: result.id };
};

// const getUserNotification = async (id: string) => {
//   const result = await prisma.notification.findMany({
//     where: { userId: id },
//   });
//   return result;
// };

const updateTwoFactorAuthentication = async (userId: string, data: boolean) => {
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactor: data,
    },
    select: { id: true, twoFactor: true },
  });

  return result;
};

export const UserServices = {
  registerUser,
  requestPasswordReset,
  verifyOtp,
  resetPassword,
  updateUser,
  getProfile,
  getAllUsers,
  getSingleUser,
  // getUserNotification,
  updateTwoFactorAuthentication,
};
