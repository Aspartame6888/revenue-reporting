const axios = require("axios");
const { getAccessToken } = require("./auth");
const config = require("../config/config");

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayBeforeYesterdayDate = () => {
  const today = new Date();
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);
  return formatDate(dayBeforeYesterday);
};

const fetchDataFromThirdParty = async () => {
  try {
    const accessToken = await getAccessToken();
    const dayBeforeYesterday = getDayBeforeYesterdayDate();
    const apiRequests = config.bsApi.map((url) => {
      const lockscreenMatch = url.match(/oppo-lockscreen-([a-z]{2})/);
      const browserMatch = url.match(/oppo-browser-([a-z]{2})/);
      const otherMatch = url.match(/oppo-([a-z-]+)/);

      let region = "";
      let media = "";

      if (lockscreenMatch) {
        region = lockscreenMatch[1].toUpperCase();
        media = "oppo-lockscreen";
      } else if (browserMatch) {
        region = browserMatch[1].toUpperCase();
        media = "oppo-browser";
      } else if (otherMatch) {
        region = otherMatch[1].toUpperCase().replace(/-/g, " ");
        media = "oppo";
      } else {
        console.error(`Invalid URL format: ${url}`);
        return Promise.resolve(null);
      }

      console.log(
        `Fetching data from URL: ${url}, Region: ${region}, Media: ${media}`
      );

      return axios
        .get(
          `${url}?start_date=${dayBeforeYesterday}&end_date=${dayBeforeYesterday}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => ({ data: response.data, region, media }))
        .catch((err) => {
          console.error(
            `Failed to fetch data from URL: ${url}. Error: ${err.message}`
          );
          return null;
        });
    });

    const responses = await Promise.all(apiRequests);

    const allData = responses
      .filter((response) => response !== null)
      .flatMap((response) =>
        transformData(response.data, response.region, response.media)
      );

    return { incomeList: allData };
  } catch (error) {
    throw new Error(
      `Failed to fetch data from third party API: ${error.message}`
    );
  }
};

const transformData = (data, region, media) => {
  try {
    const results = data.results || [];
    const transformedData = results.map((result) => ({
      date: parseInt(result.date.split(" ")[0].replace(/-/g, "")),
      brand: "OPPO",
      model: "",
      region: region,
      customId: "Taboola_Test_20240617",
      media: media,
      currency: result._currency || "USD",
      income: 100000,
      incomeType: "",
      customApp: "",
      impressions: 0,
    }));

    return transformedData;
  } catch (error) {
    throw new Error(`Failed to transform data: ${error.message}`);
  }
};

module.exports = { fetchDataFromThirdParty };
