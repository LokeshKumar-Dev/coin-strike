const express = require("express");
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const dayjs = require("dayjs");

const { protect, admin } = require("../Middleware/AuthMiddleware.js");
const Transaction = require("./../Models/transactionModel.js");
const User = require("./../Models/userModel.js");

const tranRouter = express.Router();

const userIncomeUpdate = async (req, amount) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      {
        $inc: { income: amount },
        $set: { [`incomeList.${dayjs().month()}`]: req.user.income + amount },
      },
      { new: true }
    );
    return true; // Return true if the update is successful
  } catch (err) {
    console.log(err);
    return false; // Return false
  }
};

const userExpenseUpdate = async (req, amount) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      {
        $inc: { expense: amount },
        $set: { [`expenseList.${dayjs().month()}`]: req.user.expense + amount },
      },
      { new: true }
    );
  } catch (err) {
    console.log(err);
  }
};

//==================ENTRY ROUTES==================

// Add Entry
tranRouter.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { name, amount, date, category, type, description } = req.body;
      const data = await Transaction.create({
        name,
        amount,
        date,
        category,
        type,
        user: req.user._id,
        description,
      });

      if (type === "income") {
        await userIncomeUpdate(req, amount, true);
      } else {
        await userExpenseUpdate(req, amount, true);
      }
      res.status(200).json({
        msg: "inserted Success",
        data,
      });
    } catch (err) {
      res.status(404).json({ msg: err });
    }
  })
);

//GET Entry
tranRouter.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { page = 1, limit } = req.query;
      const totalTransactions = await Transaction.countDocuments({
        $and: [
          { user: req.user._id },
          {
            $or: [{ type: "expense" }, { type: "income" }],
          },
        ],
      });
      var totalPages = 1;
      if (totalTransactions > 10) {
        // Calculate total number of pages
        totalPages = Math.ceil(totalTransactions / limit);
      }
      //Date Sorting
      // const obj = await Transaction.find({ user: req.user._id }).sort({
      //   date: -1,
      // });
      const obj = await Transaction.find({
        $and: [
          { user: req.user._id },
          {
            $or: [{ type: "expense" }, { type: "income" }],
          },
        ],
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      res.status(200).json({
        msg: "inserted Success",
        data: {
          entries: obj,
          page: 1,
          pages: totalPages,
          total: totalTransactions,
        },
      });
    } catch (err) {
      res.status(404).json({ msg: err });
    }
  })
);

//GET Sort Entry
tranRouter.get(
  "/sorted?",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { page = 1, limit } = req.query;
      const totalTransactions = await Transaction.countDocuments({
        $and: [
          { user: req.user._id },
          {
            $or: [{ type: "expense" }, { type: "income" }],
          },
        ],
      });
      const totalPages = 1;
      if (totalTransactions > 10) {
        // Calculate total number of pages
        totalPages = Math.ceil(totalTransactions / limit);
      }
      //Date Sorting
      // const obj = await Transaction.find({ user: req.user._id }).sort({
      //   date: -1,
      // });
      const { sortBy, sortOrder } = req.query;
      const obj = await Transaction.find({
        $and: [
          { user: req.user._id },
          {
            $or: [{ type: "expense" }, { type: "income" }],
          },
        ],
      })
        .sort({ [sortBy]: sortOrder === "low" ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      res.status(200).json({
        msg: "inserted Success",
        data: {
          entries: obj,
          page: page || 1,
          pages: totalPages,
          total: totalTransactions,
        },
      });
    } catch (err) {
      res.status(404).json({ msg: err });
    }
  })
);

// UPDATE Entry
tranRouter.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id);
      if (transaction) {
        transaction.name = req.body.name || transaction.name;
        const flagAmount = transaction.amount !== req.body.amount;
        const diff = flagAmount
          ? req.body.amount - parseInt(transaction.amount)
          : 0;
        // console.log(flagAmount, diff);
        transaction.amount = req.body.amount || transaction.amount;
        transaction.description =
          req.body.description || transaction.description;
        transaction.category = req.body.category || transaction.category;
        const flagType = transaction.type !== req.body.type;
        transaction.type = req.body.type || transaction.type;

        //DATE update
        if (req.body.date) {
          transaction.date = req.body.date;
        }
        // console.log(req.body);
        const updatedEntry = await transaction.save(); //Save
        if (flagType) {
          if (transaction.type === "income") {
            await userIncomeUpdate(req, parseInt(transaction.amount));
            await userExpenseUpdate(req, parseInt(transaction.amount) * -1);
          } else {
            await userIncomeUpdate(req, parseInt(transaction.amount) * -1);
            await userExpenseUpdate(req, parseInt(transaction.amount));
          }
        }
        if (flagAmount) {
          if (transaction.type === "income") {
            await userIncomeUpdate(req, diff);
          } else {
            await userExpenseUpdate(req, diff);
          }
        }
        res.json({
          _id: updatedEntry._id,
          user: req.user._id,
          name: updatedEntry.name,
          amount: updatedEntry.amount,
          description: updatedEntry.description,
          category: updatedEntry.category,
          type: updatedEntry.type,
          date: updatedEntry.date,
        });
      } else {
        res.status(404);
        throw new Error("Transaction not found");
      }
    } catch (err) {
      console.log(err);
      res.status(404);
      throw new Error("Transaction not found");
    }
  })
);

// DELETE Entry
tranRouter.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const totalTransactions = await Transaction.countDocuments({
      user: req.user._id,
    });
    const totalPages = 1;
    if (totalTransactions > 10) {
      // Calculate total number of pages
      totalPages = Math.ceil(totalTransactions / limit);
    }
    Transaction.deleteOne({ _id: req.params.id })
      .then((obj) => {
        //Checks Deleted by Count
        if (obj.deletedCount != 0) {
          //Delete amount from income or expense
          if (req.query.type === "income")
            userIncomeUpdate(req, parseInt(req.query.amount) * -1);
          else userExpenseUpdate(req, parseInt(req.query.amount) * -1);

          return res.status(200).json({
            msg: "Deleted Success",
            pages: totalPages,
            total: totalTransactions,
          }); //Deleted
        } else {
          res.status(401).json({ msg: "Sorry not deleted" }); //Not Deleted
        }
      })
      .catch((err) => {
        res.status(401).json({ msg: err }); //Not Found
      });
  })
);

//==================CHART ROUTES==================
const mongoose = require("mongoose");
tranRouter.get(
  "/chart/pie",
  protect,
  asyncHandler(async (req, res) => {
    const result = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]).sort({ _id: 1 });
    res.status(200).json(result);
  })
);

//==============SUBSCRIPTION ROUTES==================

//Add Subscription
tranRouter.post("/subscription", protect, async (req, res) => {
  try {
    const { name, amount, description, cycle, date, type, auto } = req.body;
    const subscription = new Transaction({
      name,
      amount,
      description,
      cycle,
      type,
      auto,
      date,
      user: req.user._id,
    });
    const newSubscription = await subscription.save();
    userExpenseUpdate(req, parseInt(amount));
    res.status(201).json(newSubscription);
  } catch (err) {
    res.status(401).json({ msg: err });
  }
});

//GET Subscriptions
tranRouter.get("/subscription", protect, async (req, res) => {
  try {
    const obj = await Transaction.find({
      $and: [{ user: req.user._id }, { type: "subscription" }],
    }).sort({ createdAt: -1 });
    res.status(200).json({
      data: {
        subscriptions: obj,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({ msg: err.message });
  }
});

tranRouter.put("/subscription/:id", protect, async (req, res) => {
  try {
    const subscription = await Transaction.findById(req.params.id);
    if (subscription) {
      subscription.name = req.body.name || subscription.name;
      //Amount Flag
      const flagAmount = transaction.amount !== req.body.amount;
      const diff = flagAmount
        ? req.body.amount - parseInt(transaction.amount)
        : 0;
      subscription.amount = req.body.amount || subscription.amount;
      subscription.description =
        req.body.description || subscription.description;
      subscription.cycle = req.body.cycle || subscription.cycle;
      subscription.type = req.body.type || subscription.type;
      subscription.auto = req.body.auto || subscription.auto || false;
      //DATE update
      if (req.body.date) {
        subscription.date = req.body.date;
      }
      const updatedSubscription = await subscription.save(); //Save
      if (flagAmount) {
        await userExpenseUpdate(req, diff);
      }
      res.json({
        _id: updatedSubscription._id,
        user: req.user._id,
        name: updatedSubscription.name,
        amount: updatedSubscription.amount,
        description: updatedSubscription.description,
        cycle: updatedSubscription.cycle,
        type: updatedSubscription.type,
        date: updatedSubscription.date,
      });
    } else {
      res.status(404);
      throw new Error("Subscription not found");
    }
  } catch (err) {
    console.log(err);
    res.status(404);
    throw new Error("Subscription not found");
  }
});

//Delete Subscription
tranRouter.delete("/subscription/:id", protect, async (req, res) => {
  try {
    Transaction.deleteOne({ _id: req.params.id })
      .then((obj) => {
        //Checks Deleted by Count
        if (obj.deletedCount != 0) {
          userExpenseUpdate(req, parseInt(req.query.amount) * -1);

          return res.status(200).json({
            msg: "Deleted Success",
            data: obj,
          }); //Deleted
        } else {
          res.status(401).json({ msg: "Sorry not deleted" }); //Not Deleted
        }
      })
      .catch((err) => {
        res.status(401).json({ msg: err }); //Not Found
      });
  } catch (err) {
    console.log(err);
    res.status(404);
    throw new Error("Subscription not found");
  }
});

const transactionRouter = tranRouter;
module.exports = transactionRouter;
