const User = require("../models/User");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const config = require("../config");
const EmailService = require("../services/EmailService");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: "10d",
  });
};

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;

  // Remove password if present
  delete userObj.password;
  delete userObj.__v;
  delete userObj.otp;
  delete userObj.otpExpires;
  // Keeping timestamps and status fields as requested

  // Sanitize linked accounts
  if (userObj.linkedAccounts) {
    userObj.linkedAccounts = userObj.linkedAccounts.map((account) => ({
      _id: account._id,
      provider: account.provider,
      providerId: account.providerId,
      email: account.email,
      storageQuota: account.storageQuota,
      // Exclude tokens, expiry
    }));
  }

  return userObj;
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const sanitizedUser = sanitizeUser(user);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: sanitizedUser,
    },
  });
};

const generateOTP = () => {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = async (req, res, next) => {
  try {
    const newUser = await User.create({
      email: req.body.email,
      password: req.body.password,
      isVerified: false, // Explicitly set to false
    });

    // Generate OTP
    const otp = generateOTP();
    newUser.otp = otp;
    newUser.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await newUser.save({ validateBeforeSave: false });

    // Send Email
    await EmailService.sendOTP(newUser.email, otp);

    res.status(201).json({
      status: "success",
      message:
        "Registration successful. Please check your email for the verification code.",
      data: {
        email: newUser.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError("Please provide email and OTP", 400));
    }

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Invalid or expired OTP", 400));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.lastLogin = Date.now();
    user.isLoggedIn = true;

    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please provide email and password!", 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // 3) Check if user is verified
    if (user.isVerified) {
      return createSendToken(user, 200, res);
    }

    // 4) Generate OTP for Verification (only if not verified)
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // 5) Send Email
    await EmailService.sendOTP(user.email, otp);

    res.status(200).json({
      status: "otp_sent",
      message: "OTP sent to your email. Please verify to complete login.",
      data: {
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyLogin = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError("Please provide email and OTP", 400));
    }

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Invalid or expired OTP", 400));
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;

    // Update login stats
    user.lastLogin = Date.now();
    user.isLoggedIn = true;

    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError("Please provide your email address", 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(
        new AppError("There is no user with that email address", 404)
      );
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await EmailService.sendOTP(user.email, otp);

    res.status(200).json({
      status: "success",
      message: "OTP sent to your email.",
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return next(
        new AppError("Please provide email, OTP and new password", 400)
      );
    }

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Invalid or expired OTP", 400));
    }

    user.password = password;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save(); // Will trigger pre-save hash

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // If we had a cookie-based auth, we would clear it here.
    // For JWT stateless, we can't "invalidate" the token easily without a blacklist.
    // But we can update the user status.

    // We need the user from the protect middleware to be attached to req
    if (req.user) {
      req.user.isLoggedIn = false;
      await req.user.save({ validateBeforeSave: false });
    }

    res.status(200).json({ status: "success" });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res, next) => {
  const sanitizedUser = sanitizeUser(req.user);
  res.status(200).json({
    status: "success",
    data: {
      user: sanitizedUser,
    },
  });
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check of it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2) Verification token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};
