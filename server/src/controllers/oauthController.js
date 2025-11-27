const User = require("../models/User");
const AppError = require("../utils/AppError");
const config = require("../config");

const GoogleDriveProvider = require("../services/cloud/GoogleDriveProvider");

// Placeholder for Provider Factory (to be implemented)
const getProvider = (providerName) => {
  switch (providerName.toLowerCase()) {
    case "google":
      return new GoogleDriveProvider();
    default:
      throw new AppError(
        `Provider '${providerName}' is not yet supported.`,
        400
      );
  }
};

exports.initiateAuth = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const cloudProvider = getProvider(provider);

    const authUrl = await cloudProvider.authenticate();

    // Set a short-lived cookie to track the user across the redirect
    res.cookie("pending_user", req.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Required for OAuth redirects
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.status(200).json({
      status: "success",
      data: { url: authUrl },
    });
  } catch (err) {
    next(err);
  }
};

exports.handleCallback = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code } = req.query;
    const userId = req.cookies.pending_user;

    if (!userId) {
      return next(
        new AppError("Authentication session expired. Please try again.", 401)
      );
    }

    if (!code) {
      return next(new AppError("Authorization code is missing.", 400));
    }

    const cloudProvider = getProvider(provider);
    const tokenData = await cloudProvider.exchangeCode(code);

    // Link Account Logic (Duplicated from linkAccount, could be refactored)
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    const existingIndex = user.linkedAccounts.findIndex(
      (acc) => acc.provider === provider
    );

    const newAccount = {
      provider,
      providerId: tokenData.providerId || "unknown",
      email: tokenData.email,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiryDate: tokenData.expiryDate,
    };

    if (existingIndex > -1) {
      user.linkedAccounts[existingIndex] = newAccount;
    } else {
      user.linkedAccounts.push(newAccount);
    }

    await user.save();

    // Clear cookie
    res.clearCookie("pending_user");

    // Redirect back to frontend
    res.redirect(
      `${config.CLIENT_URL}/settings?status=success&provider=${provider}`
    );
  } catch (err) {
    // If error, redirect to frontend with error param
    console.error("OAuth Callback Error:", err);
    res.redirect(
      `${config.CLIENT_URL}/settings?status=error&message=${encodeURIComponent(
        err.message
      )}`
    );
  }
};

exports.linkAccount = async (req, res, next) => {
  // This is the endpoint the Client calls with the code
  try {
    const { provider } = req.params;
    const { code } = req.body;
    const userId = req.user.id;

    const cloudProvider = getProvider(provider);
    const tokenData = await cloudProvider.exchangeCode(code);

    // Update User
    const user = await User.findById(userId);

    // Check if already linked
    const existingIndex = user.linkedAccounts.findIndex(
      (acc) => acc.provider === provider
    );

    const newAccount = {
      provider,
      providerId: tokenData.providerId || "unknown", // Provider should return this
      email: tokenData.email,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiryDate: tokenData.expiryDate,
    };

    if (existingIndex > -1) {
      user.linkedAccounts[existingIndex] = newAccount;
    } else {
      user.linkedAccounts.push(newAccount);
    }

    await user.save();

    res.status(200).json({
      status: "success",
      message: `${provider} account linked successfully.`,
      data: { linkedAccounts: user.linkedAccounts },
    });
  } catch (err) {
    next(err);
  }
};

exports.unlinkProvider = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user.id);

    user.linkedAccounts = user.linkedAccounts.filter(
      (acc) => acc.provider !== provider
    );
    await user.save();

    res.status(200).json({
      status: "success",
      message: `${provider} account unlinked successfully.`,
      data: { linkedAccounts: user.linkedAccounts },
    });
  } catch (err) {
    next(err);
  }
};
