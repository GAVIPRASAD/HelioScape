const GoogleDriveProvider = require("../services/cloud/GoogleDriveProvider");
const AppError = require("../utils/AppError");

/**
 * Get storage quota for all linked providers.
 */
exports.getQuota = async (req, res, next) => {
  try {
    const quotas = [];

    if (req.user.linkedAccounts && req.user.linkedAccounts.length > 0) {
      for (const account of req.user.linkedAccounts) {
        try {
          if (account.provider === "google") {
            const provider = new GoogleDriveProvider();
            // We need to set credentials to make API calls
            provider.setCredentials({
              accessToken: account.accessToken,
              refreshToken: account.refreshToken,
              expiryDate: account.expiryDate,
            });

            // Handle token refresh if it happens during quota fetch
            provider.onTokenRefresh(async (newTokens) => {
              console.log("[GoogleDrive] Token Refreshed during quota check!");
              const accountIndex = req.user.linkedAccounts.findIndex(
                (a) =>
                  a.provider === "google" && a.providerId === account.providerId
              );
              if (accountIndex !== -1) {
                req.user.linkedAccounts[accountIndex].accessToken =
                  newTokens.access_token;
                if (newTokens.refresh_token) {
                  req.user.linkedAccounts[accountIndex].refreshToken =
                    newTokens.refresh_token;
                }
                req.user.linkedAccounts[accountIndex].expiryDate = new Date(
                  newTokens.expiry_date
                );
                await req.user.save();
              }
            });

            const quota = await provider.getQuota({
              accessToken: account.accessToken,
              refreshToken: account.refreshToken,
              expiryDate: account.expiryDate,
            });

            quotas.push({
              provider: "google",
              providerId: account.providerId,
              email: account.email,
              ...quota,
            });
          }
          // Add other providers here
        } catch (err) {
          console.error(
            `[Quota] Failed to fetch quota for ${account.provider}:`,
            err.message
          );
          // Return error state for this provider but don't fail the whole request
          quotas.push({
            provider: account.provider,
            providerId: account.providerId,
            email: account.email,
            error: "Failed to fetch quota",
            total: 0,
            used: 0,
            available: 0,
          });
        }
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        quotas,
      },
    });
  } catch (err) {
    next(err);
  }
};
