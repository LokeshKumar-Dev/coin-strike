const express = require("express");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = require("./dbConfig");
connectDB();

app.get("/", (req, res) => {
  return res.json("works");
});

app.post("/payment", (req, res) => {
  const { amount, email } = req.body;

  /* import checksum generation utility */
  const totalAmount = JSON.stringify(amount);
  var params = {};

  /* initialize an array */
  params["MID"] = process.env.PAYTM_MID;
  params["WEBSITE"] = process.env.PAYTM_WEBSITE;
  params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID;
  params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE_ID;
  params["ORDER_ID"] = uuidv4();
  params["CUST_ID"] = process.env.PAYTM_CUST_ID;
  params["TXN_AMOUNT"] = totalAmount;
  params["CALLBACK_URL"] = "http://localhost:5000/api/callback";
  params["EMAIL"] = email;
  params["MOBILE_NO"] = "9876543210";

  /**
   * Generate checksum by parameters we have
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  var paytmChecksum = PaytmChecksum.generateSignature(
    params,
    process.env.PAYTM_MERCHANT_KEY
  );
  paytmChecksum
    .then(function (checksum) {
      let paytmParams = {
        ...params,
        CHECKSUMHASH: checksum,
      };
      res.json(paytmParams);
    })
    .catch(function (error) {
      console.log(error);
    });
});

const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
app.use("/api/user", userRoutes);
app.use("/api/entry", transactionRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server runs on ${PORT}`);
});

// # PAYTM_MID =
// # PAYTM_WEBSITE =
// # PAYTM_CHANNEL_ID =
// # PAYTM_INDUSTRY_TYPE_ID =
// # PAYTM_CUST_ID =
// # PAYTM_MERCHANT_KEY =
