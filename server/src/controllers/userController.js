const User = require("../models/User");
const AppError = require("../utils/AppError");
const authController = require("./authController"); // Re-use signToken/createSendToken logic if needed, or just send response

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = async (req, res, next) => {
  try {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates. Please use /updateMyPassword.",
          400
        )
      );
    }

    // 2) Filtered out unwanted field names that are not allowed to be updated
    const filteredBody = filterObj(req.body, "name", "email", "preferences");

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select("+password");

    // 2) Check if POSTed current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError("Your current password is wrong", 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    // user.passwordConfirm = req.body.passwordConfirm; // If we had validation
    await user.save();

    // 4) Log user in, send JWT
    // We can reuse authController's logic or just send success
    // Ideally we send a new token
    // For simplicity now, let's just send success and let client handle re-login or just keep using old token (if valid)
    // Actually, changing password usually invalidates tokens if we use `passwordChangedAt`
    // But our simple JWT implementation might not check that.
    // Let's just return success.

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (err) {
    next(err);
  }
};
