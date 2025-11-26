const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fieldEncryption = require("mongoose-field-encryption").fieldEncryption;
const config = require("../config");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
    linkedAccounts: [
      {
        provider: {
          type: String,
          required: true,
          enum: ["google", "dropbox", "mega"],
        },
        providerId: { type: String, required: true },
        email: { type: String },
        accessToken: { type: String, required: true }, // Encrypted
        refreshToken: { type: String }, // Encrypted
        expiryDate: { type: Date },
        storageQuota: {
          total: { type: Number, default: 0 },
          used: { type: Number, default: 0 },
        },
      },
    ],
    lastLogin: {
      type: Date,
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt sensitive fields
UserSchema.plugin(fieldEncryption, {
  fields: ["linkedAccounts.refreshToken"],
  secret: config.JWT_SECRET, // Using JWT_SECRET for now, ideally separate DB_SECRET
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model("User", UserSchema);
