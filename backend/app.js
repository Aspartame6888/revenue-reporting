const express = require("express");
const axios = require("axios");
const schedule = require("node-schedule");
const logger = require("./config/logger");
const bodyParser = require("body-parser");
const dataRoutes = require("./routes/data");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const CryptoJS = require("crypto-js");

const app = express();
const PORT = process.env.PORT || 5008;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(bodyParser.json());
app.use("/api", dataRoutes);

const thirdPartyApi1 = "https://api.example.com/data";
const oppoTestApi =
  "https://global-search-sg-test.wanyol.com/gis/open/income/add";

// 定时任务：每三分钟一次 for test
// schedule.scheduleJob("*/3 * * * *", async () => {
// 定时任务：每天一次
schedule.scheduleJob("0 0 * * *", async () => {
  try {
    // const response = await axios.get(thirdPartyApi1);
    // const data = response.data;
    const data = {
      incomeList: [
        {
          date: 20240301,
          brand: "OPPO",
          model: "PGEM",
          region: "TH",
          customId: "Google",
          media: "商店",
          currency: "USD",
          income: 123450000,
          incomeType: "",
          customApp: "",
          impressions: 0,
        },
      ],
    };

    const apiKey = "89fc80d5a056d8d69e18b4648fd32bd0";
    const apiSecret =
      "Zh5J9Blwkl64uQ6GGXSb2ET25Ruwkk269slGSaDuRYd/ySx5TA+bBQ==";
    const timestamp = Date.now().toString();
    const sign = CryptoJS.SHA256(apiKey + apiSecret + timestamp).toString(
      CryptoJS.enc.Hex
    );

    const headers = {
      Accept: "application/json",
      timestamp,
      apiKey,
      sign,
    };

    const response = await axios.post(oppoTestApi, data, { headers });
    const successMessage = `Success: Data sent successfully at ${new Date().toISOString()}. Response: ${JSON.stringify(
      response.data
    )}`;
    logger.info(successMessage);
    fs.appendFileSync(
      path.join(__dirname, "logs", "success.log"),
      successMessage + "\n"
    );
  } catch (error) {
    const errorMessage = `Error: ${
      error.message
    } at ${new Date().toISOString()}.`;
    logger.error(errorMessage);
    fs.appendFileSync(
      path.join(__dirname, "logs", "error.log"),
      errorMessage + "\n"
    );
  }
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
