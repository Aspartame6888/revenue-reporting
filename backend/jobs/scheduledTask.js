const axios = require("axios");
const schedule = require("node-schedule");
const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
const logger = require("../config/logger");
const config = require("../config/config");

const sendData = async () => {
  try {
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

    const timestamp = Date.now().toString();
    const sign = CryptoJS.SHA256(
      config.apiKey + config.apiSecret + timestamp
    ).toString(CryptoJS.enc.Hex);

    const headers = {
      Accept: "application/json",
      timestamp,
      apiKey: config.apiKey,
      sign,
    };

    const response = await axios.post(config.oppoTestApi, data, { headers });
    const successMessage = `Success: Data sent successfully at ${new Date().toISOString()}. Response: ${JSON.stringify(
      response.data
    )}`;
    logger.info(successMessage);
    fs.appendFileSync(
      path.join(__dirname, "..", "logs", "success.log"),
      successMessage + "\n"
    );
  } catch (error) {
    const errorMessage = `Error: ${
      error.message
    } at ${new Date().toISOString()}.`;
    logger.error(errorMessage);
    fs.appendFileSync(
      path.join(__dirname, "..", "logs", "error.log"),
      errorMessage + "\n"
    );
  }
};

// schedule.scheduleJob("0 0 * * *", sendData);
schedule.scheduleJob("*/3 * * * *", sendData);
