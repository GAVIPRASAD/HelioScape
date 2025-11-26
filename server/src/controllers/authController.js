const User = require("../models/User");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const config = require("../config");

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
  // Keeping timestamps and status fields as requested

  // Sanitize linked accounts
  if (userObj.linkedAccounts) {
    userObj.linkedAccounts = userObj.linkedAccounts.map((account) => ({
      provider: account.provider,
      email: account.email,
      storageQuota: account.storageQuota,
      // Exclude tokens, expiry, providerId
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

exports.register = async (req, res, next) => {
  try {
    const newUser = await User.create({
      email: req.body.email,
      password: req.body.password,
    });

    createSendToken(newUser, 201, res);
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

    // 3) Update lastLogin and isLoggedIn
    user.lastLogin = Date.now();
    user.isLoggedIn = true;
    await user.save({ validateBeforeSave: false });

    // 4) If everything ok, send token to client
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
