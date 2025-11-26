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

    // Generate auth URL
    // Pass user ID as state to identify user in callback if needed,
    // though usually we handle this via session/cookie or client-side flow.
    // For this architecture, we might need to be careful about state.
    const authUrl = await cloudProvider.authenticate();

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
    const { code, state } = req.query; // 'state' could be used for security/user tracking

    if (!code) {
      return next(new AppError("Authorization code is missing.", 400));
    }

    const cloudProvider = getProvider(provider);
    const tokenData = await cloudProvider.exchangeCode(code);

    // TODO: We need to know WHICH user this is for.
    // Since the callback comes from the provider to the backend directly (usually),
    // we lose the Auth header.
    // Strategies:
    // 1. Pass JWT in 'state' param during initiateAuth.
    // 2. Client handles the callback code and sends it to a POST endpoint (Preferred for SPA).

    // For now, let's assume Strategy 2: Client receives code -> POST /api/oauth/:provider/link
    // But this route is GET /callback.
    // If we stick to server-side callback, we MUST use the 'state' param to pass the userId (encrypted/signed).

    // Let's pivot to Strategy 2 for better SPA integration:
    // The 'callback' endpoint here might just redirect back to the client with the code?
    // Or we change the architecture to have the Client handle the redirect, grab the code, and call the API.

    // Let's implement a simple success response for now, assuming the User will hit a different endpoint to actually link.
    // WAIT: The plan says "Token Exchange".

    res.status(200).json({
      status: "success",
      message: "Callback received. Please implement client-side code handling.",
      code,
    });
  } catch (err) {
    next(err);
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
