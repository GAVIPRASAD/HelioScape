const User = require("../models/User");
const AppError = require("../utils/AppError");
const config = require("../config");

const GoogleDriveProvider = require("../services/cloud/GoogleDriveProvider");
const DropboxProvider = require("../services/cloud/DropboxProvider");
const MegaProvider = require("../services/cloud/MegaProvider");

// Placeholder for Provider Factory (to be implemented)
const getProvider = (providerName) => {
  switch (providerName.toLowerCase()) {
    case "google":
      return new GoogleDriveProvider();
    case "dropbox":
      return new DropboxProvider();
    case "mega":
      return new MegaProvider();
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

    console.log(
      `[OAuth Callback] Provider: ${provider}, Code: ${
        code ? "Present" : "Missing"
      }, UserCookie: ${userId}`
    );

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
      (acc) =>
        acc.provider === provider && acc.providerId === tokenData.providerId
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
    console.log("Redirecting to error page...");
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

    // Check if THIS specific account is already linked
    const existingIndex = user.linkedAccounts.findIndex(
      (acc) =>
        acc.provider === provider && acc.providerId === tokenData.providerId
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
      // Update existing account (e.g. refresh token)
      user.linkedAccounts[existingIndex] = newAccount;
    } else {
      // Add new account
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
    const { provider, providerId } = req.params; // providerId here will be the _id
    console.log(`[Unlink] Request to unlink account with _id: ${providerId}`);

    const user = await User.findById(req.user.id);

    // Find the account first to get its details
    const accountToRemove = user.linkedAccounts.find(
      (acc) => String(acc._id) === providerId
    );

    if (!accountToRemove) {
      return next(new AppError("Account not found.", 404));
    }

    // SAFETY CHECK: Check if any files are stored on this provider
    // The format in File.chunks.provider is "provider-providerId"
    const providerString = `${accountToRemove.provider}-${accountToRemove.providerId}`;
    console.log(`[Unlink] Checking for files on: ${providerString}`);

    // We need to import File model at the top if not already there.
    // Assuming File is required. If not, I'll add it.
    const File = require("../models/File");

    const hasFiles = await File.exists({
      $or: [
        { "chunks.provider": providerString }, // Standard: "dropbox-123"
        { "chunks.provider": accountToRemove.provider }, // Legacy: "dropbox"
        { "chunks.provider": `${accountToRemove.provider}-undefined` }, // Edge case
        { "chunks.provider": `${accountToRemove.provider}-null` }, // Edge case
      ],
      user: req.user.id,
    });

    if (hasFiles) {
      return next(
        new AppError(
          "Cannot unlink: This account contains file data. Please delete the files first.",
          400
        )
      );
    }

    // Proceed with unlink
    const initialLength = user.linkedAccounts.length;
    user.linkedAccounts = user.linkedAccounts.filter(
      (acc) => String(acc._id) !== providerId
    );

    await user.save();
    console.log(`[Unlink] User saved successfully.`);

    res.status(200).json({
      status: "success",
      message: `Account unlinked successfully.`,
      data: { linkedAccounts: user.linkedAccounts },
    });
  } catch (err) {
    next(err);
  }
};

exports.megaLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError("Email and password are required.", 400));
    }

    // Use MegaProvider to authenticate
    const provider = new MegaProvider();
    // We use a static method or helper on the instance to perform the login
    // Since authenticate() in CloudProvider is for OAuth URL, we need a custom method.
    // Let's call it `login(email, password)`
    const session = await provider.login(email, password);

    // Save to User
    const user = await User.findById(req.user.id);

    // Check if already linked
    const existingIndex = user.linkedAccounts.findIndex(
      (acc) => acc.provider === "mega" && acc.email === email
    );

    const newAccount = {
      provider: "mega",
      providerId: `mega-${Date.now()}`, // MEGA doesn't give a stable ID easily without fetching info, use timestamp or email hash?
      // Actually, let's fetch user info from session to get a real ID if possible, or just use email.
      email: email,
      accessToken: session, // The session dump
      refreshToken: "n/a",
      expiryDate: null,
    };

    if (existingIndex > -1) {
      user.linkedAccounts[existingIndex] = newAccount;
    } else {
      user.linkedAccounts.push(newAccount);
    }

    await user.save();

    res.status(200).json({
      status: "success",
      message: "MEGA account linked successfully.",
      data: { linkedAccounts: user.linkedAccounts },
    });
  } catch (err) {
    console.error("MEGA Login Error:", err);
    next(new AppError("Failed to login to MEGA. Check credentials.", 401));
  }
};
