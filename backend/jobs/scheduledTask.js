const axios = require("axios");
const schedule = require("node-schedule");
const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
const logger = require("../config/logger");
const config = require("../config/config");
const { fetchDataFromThirdParty } = require("../services/dataService");

const appendToJsonFile = (filePath, data) => {
  try {
    let fileData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      fileData = JSON.parse(fileContent);
    }
    fileData.push(data);
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
  } catch (error) {
    logger.error(`Failed to write to JSON file: ${error.message}`);
  }
};

const sendData = async () => {
  const timestamp = Date.now().toString();
  const logTime = new Date().toISOString();

  try {
    const data = await fetchDataFromThirdParty();
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

    if (response.status === 200) {
      const successMessage = {
        success: true,
        timestamp: logTime,
        dataSent: data,
        response: response.data,
      };

      logger.info(
        `Success: Data sent successfully at ${logTime}. Response: ${JSON.stringify(
          response.data
        )}`
      );

      fs.appendFileSync(
        path.join(__dirname, "..", "logs", "success.log"),
        JSON.stringify(successMessage) + "\n"
      );
      appendToJsonFile(
        path.join(__dirname, "..", "logs", "successList.json"),
        successMessage
      );
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    const errorLog = `Error: ${error.message} at ${logTime}.`;
    logger.error(errorLog);

    fs.appendFileSync(
      path.join(__dirname, "..", "logs", "error.log"),
      errorLog + "\n"
    );

    const data = await fetchDataFromThirdParty();
    const errorMessage = {
      success: false,
      timestamp: logTime,
      dataSent: data,
      error: error.message,
    };

    logger.error(`Error: ${error.message} at ${logTime}.`);
    appendToJsonFile(
      path.join(__dirname, "..", "logs", "failedList.json"),
      errorMessage
    );
  }
};

// schedule.scheduleJob("0 0 * * *", sendData);
// schedule.scheduleJob("*/1 * * * *", sendData);
sendData();
