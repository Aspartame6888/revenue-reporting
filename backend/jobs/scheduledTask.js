const express = require("express");
const axios = require("axios");
const schedule = require("node-schedule");
const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
const logger = require("../config/logger");
const config = require("../config/config");
const { fetchDataFromThirdParty } = require("../services/dataService");
const xlsx = require("xlsx");

const app = express();

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

const generateExcelFile = (data) => {
  const workbook = xlsx.utils.book_new();

  const worksheetData = data.incomeList.map((item) => ({
    media: item.media,
    income: item.income,
    impressions: item.impressions,
    date: item.date,
    brand: item.brand,
    model: item.model,
    region: item.region,
    customId: item.customId,
    currency: item.currency,
    incomeType: item.incomeType,
    customApp: item.customApp,
  }));

  const worksheet = xlsx.utils.json_to_sheet(worksheetData, {
    header: [
      "media",
      "income",
      "impressions",
      "date",
      "brand",
      "model",
      "region",
      "customId",
      "currency",
      "incomeType",
      "customApp",
    ],
  });

  xlsx.utils.book_append_sheet(workbook, worksheet, "Income List");

  const filePath = path.join(__dirname, "..", "logs", "income_list.xlsx");
  xlsx.writeFile(workbook, filePath);

  return filePath;
};

const sendData = async () => {
  const timestamp = Date.now().toString();
  const logTime = new Date().toISOString();

  try {
    const startDate = "2024-07-01";
    const endDate = "2024-07-31";
    const data = await fetchDataFromThirdParty(startDate, endDate);
    console.log(data);
    const sign = CryptoJS.SHA256(
      config.apiKey + config.apiSecret + timestamp
    ).toString(CryptoJS.enc.Hex);

    const headers = {
      Accept: "application/json",
      timestamp,
      apiKey: config.apiKey,
      sign,
    };
    console.log(JSON.stringify(data, null, 2));

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

      generateExcelFile(data);
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

const router = express.Router();

router.get("/download-excel", (req, res) => {
  const filePath = path.join(__dirname, "..", "logs", "income_list.xlsx");

  if (fs.existsSync(filePath)) {
    res.download(filePath, "income_list.xlsx", (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Could not download the file.");
      }
    });
  } else {
    res.status(404).send("File not found.");
  }
});

app.use("/api", router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

sendData();
