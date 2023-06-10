const express = require("express");
const asyncHandler = require("express-async-handler");
const moment = require("moment");

const { protect, admin } = require("../Middleware/AuthMiddleware.js");
const Transaction = require("./../Models/transactionModel.js");

const tranRouter = express.Router();

// Add Entry
tranRouter.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    // console.log("object", req.params.id);
    const { name, amount, date, category, type, description } = req.body;
    Transaction.create({
      name,
      amount,
      date,
      category,
      type,
      user: req.user._id,
      description,
    })
      .then((obj) => {
        res.status(200).json({ msg: "inserted Success", data: obj });
      })
      .catch((err) => {
        res.status(404).json({ msg: err });
      });
  })
);
//GET Entry by ID
tranRouter.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id);

      if (transaction) {
        res.json({
          _id: transaction._id,
          name: transaction.name,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type,
          date: transaction.date,
          user: transaction.user,
        });
      } else {
        res.status(404);
        throw new Error("Transaction not found");
      }
    } catch (err) {
      res.status(404);
      throw new Error("Transaction not found");
    }
  })
);

//GET Entry by ID
tranRouter.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.find({ user: req.user._id });

    console.log(transaction);
    if (transaction) {
      res.status(200);
      res.json({
        user: req.user._id,
        entryItems: transaction,
      });
    } else {
      res.status(404);
      throw new Error("Transaction not found");
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
        transaction.amount = req.body.amount || transaction.amount;
        transaction.description =
          req.body.description || transaction.description;
        transaction.category = req.body.category || transaction.category;
        transaction.type = req.body.type || transaction.type;

        //DATE update
        if (req.body.date) {
          transaction.date = req.body.date;
        }

        const updatedEntry = await transaction.save(); //Save
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

// UPDATE Entry
tranRouter.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    Transaction.deleteOne({ _id: req.params.id })
      .then((obj) => {
        if (obj.deletedCount != 0) {
          //Checks Deleted by Count
          res.status(200).json({ msg: "Deleted Success" }); //Deleted
        } else {
          res.status(401).json({ msg: "Sorry not deleted" }); //Not Deleted
        }
      })
      .catch((err) => {
        res.status(401).json({ msg: err }); //Not Found
      });
  })
);

const transactionRouter = tranRouter;
module.exports = transactionRouter;
