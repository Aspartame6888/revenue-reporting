const axios = require("axios");
const { getAccessToken } = require("./auth");
const config = require("../config/config");

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayDate = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 2);
  return formatDate(yesterday);
};

const fetchDataFromThirdParty = async () => {
  try {
    const accessToken = await getAccessToken();
    const yesterday = getYesterdayDate();
    const url = `${config.bsApi}?start_date=${yesterday}&end_date=${yesterday}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const transformedData = transformData(response.data);
    console.log(transformedData);
    return transformedData;
  } catch (error) {
    throw new Error(
      `Failed to fetch data from third party API: ${error.message}`
    );
  }
};

const transformData = (data) => {
  try {
    const results = data.results || [];
    const transformedData = results.map((result) => ({
      date: parseInt(result.date.split(" ")[0].replace(/-/g, "")), 
      brand: "OPPO",
      model: "PGEM",
      region: "TH",
      customId: "Google",
      media: "商店",
      currency: result._currency || "USD",
      income: parseFloat((result.total_revenue || 0) * 1000000), 
      incomeType: "",
      customApp: "",
      impressions: parseInt(result.total_impressions || 0), 
    }));

    return transformedData;
  } catch (error) {
    throw new Error(`Failed to transform data: ${error.message}`);
  }
};

module.exports = { fetchDataFromThirdParty };
