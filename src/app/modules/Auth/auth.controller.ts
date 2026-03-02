import httpStatus from 'http-status';
import { AuthServices } from './auth.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { Request, Response } from 'express';

// 🔹 Login controller
const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUserFromDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User logged in successfully',
    data: result,
  });
});

// ✅ Google login controller
const googleLogin = catchAsync(async (req, res) => {
  const { email, name, fcmToken, image } = req.body;
  const result = await AuthServices.googleLogin({ email, name, fcmToken, image });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Login successful',
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await AuthServices.verifyTwoFactorOTP(email, otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully',
    data: result,
  });
});

const resendTwoFactorOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthServices.resendTwoFactorOTP(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP resent successfully',
    data: result,
  });
});

// const changePassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {

//   const result = await AuthServices.changePassword(req.user.userId, req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Password changed successfully',
//     data: result,
//   });
// });


export const AuthControllers = { loginUser, verifyOtp, googleLogin, resendTwoFactorOTP };
