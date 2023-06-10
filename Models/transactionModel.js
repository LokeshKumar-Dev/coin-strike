const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    amount: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["income", "expense", "subscription"],
    },
    period: {
      type: Number,
    },
    status: {
      type: Boolean,
    },
    auto: {
      type: Boolean,
    },
    date: {
      type: Date,
      required: true,
      set: function (value) {
        // Extracting the date portion
        const [year, month, day, hour, minute, second] = value.split(":");
        const newDate = new Date(year, month - 1, day, hour, minute, second);

        return newDate;
      },
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Entry", transactionSchema);

module.exports = Transaction;
