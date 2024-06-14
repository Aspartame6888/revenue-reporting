const express = require("express");
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

module.exports = router;
