const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "User must have a name"] },
  email: {
    type: String,
    required: [true, "User must have an email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "User must have a password"],
    select: false,
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
