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
const nodemailer = require("nodemailer");

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

const sendEmailWithAttachment = async (filePath) => {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const formattedDate = `${year}${month}${day}`;

  let transporter = nodemailer.createTransport({
    host: "smtp.163.com", // 网易163邮箱的SMTP服务器
    port: 465, // 使用SSL端口
    secure: true, // 启用SSL
    auth: {
      user: "xie15330835566@163.com", // 网易邮箱地址
      pass: "BHJCXHMUYRZSUZKJ", // 网易邮箱授权码
    },
  });

  let mailOptions = {
    from: '"Liang.x" <xie15330835566@163.com>',
    to: ["liang.x@taboola.com", "yuelin.z@taboola.com", "young.z@taboola.com","michelle.h@taboola.com","alex.z@taboola.com"],
    subject: `Oppo's revenue data report (${formattedDate})`,
    text: "Please find the attached income_list.xlsx file.",
    attachments: [
      {
        filename: "income_list.xlsx",
        path: filePath,
      },
    ],
  };

  let info = await transporter.sendMail(mailOptions);
  console.log("邮件发送成功: %s", info.messageId);
};

const sendData = async () => {
  const timestamp = Date.now().toString();
  const logTime = new Date().toISOString();

  try {
    const data = await fetchDataFromThirdParty();
    generateExcelFile(data);
    const sign = CryptoJS.SHA256(
      config.prdApiKey + config.prdApiSecret + timestamp
    ).toString(CryptoJS.enc.Hex);

    const headers = {
      Accept: "application/json",
      timestamp,
      apiKey: config.prdApiKey,
      sign,
    };

    const response = await axios.post(config.oppoPrdApi, data, { headers });

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
      const filePath = path.join(__dirname, "..", "logs", "income_list.xlsx");
      await sendEmailWithAttachment(filePath);
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

schedule.scheduleJob("0 0 * * *", () => {
  console.log("Executing scheduled task...");
  sendData();
});

// Initial run of sendData
sendData();
