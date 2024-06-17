const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { fetchDataFromThirdParty } = require("../services/dataService");

router.get("/income", async (req, res) => {
  try {
    const data = await fetchDataFromThirdParty();
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/logs/success", (req, res) => {
  const filePath = path.join(__dirname, "..", "logs", "successList.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send(`Error reading success log: ${err.message}`);
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseError) {
      res.status(500).send(`Error parsing success log: ${parseError.message}`);
    }
  });
});

router.get("/logs/failed", (req, res) => {
  const filePath = path.join(__dirname, "..", "logs", "failedList.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send(`Error reading failed log: ${err.message}`);
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseError) {
      res.status(500).send(`Error parsing failed log: ${parseError.message}`);
    }
  });
});

module.exports = router;
