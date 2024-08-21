const axios = require("axios");
const { getAccessToken } = require("./auth");
const { getStatus } = require("./db");
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
  console.log("start fetching Data From ThirdParty");
  try {
    const accessToken = await getAccessToken();
    const dayBeforeYesterday = getDayBeforeYesterdayDate();
    const apiRequests = config.bsApi.map(async (url) => {
      const lockscreenMatch = url.match(/oppo-lockscreen-([a-z-]+)/);
      const browserMatch = url.match(/oppo-browser-([a-z-]+)/);
      const searchMatch = url.match(/oppo-search-([a-z-]+)/);
      const oneplusLockscreenMatch = url.match(/oneplus-lockscreen-([a-z-]+)/);
      const otherMatch = url.match(/oppo-([a-z-]+)/);

      let region = "";
      let media = "";
      let name = "";

      if (lockscreenMatch) {
        region = lockscreenMatch[1].toUpperCase().replace(/-/g, " ");
        media = "oppo-lockscreen";
        name = `oppo-lockscreen-${lockscreenMatch[1]}`;
      } else if (browserMatch) {
        region = browserMatch[1].toUpperCase().replace(/-/g, " ");
        media = "oppo-browser";
        name = `oppo-browser-${browserMatch[1]}`;
      } else if (searchMatch) {
        region = searchMatch[1].toUpperCase().replace(/-/g, " ");
        media = "oppo-search";
        name = `oppo-search-${searchMatch[1]}`;
      } else if (oneplusLockscreenMatch) {
        region = oneplusLockscreenMatch[1].toUpperCase().replace(/-/g, " ");
        media = "oneplus-lockscreen";
        name = `oneplus-lockscreen-${oneplusLockscreenMatch[1]}`;
      } else if (otherMatch) {
        region = otherMatch[1].toUpperCase().replace(/-/g, " ");
        media = "oppo";
        name = `oppo-${otherMatch[1]}`;
      } else {
        console.log(`Invalid URL format: ${url}`);
        return null;
      }

      const isActive = await getStatus(name);

      if (!isActive) {
        // console.log(`Skipping inactive URL: ${url}`);
        return null;
      }

      // console.log(
      //   `Fetching data from URL: ${url}, Region: ${region}, Media: ${media}`
      // );
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
          console.log(
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
    console.log(`Failed to fetch data from third party API: ${error.message}`);
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
      customId: "Taboola",
      media: media,
      currency: result._currency || "USD",
      income: result.total_revenue >= 1 ? result.total_revenue : 1,
      incomeType: "",
      customApp: "",
      impressions: result.total_impressions,
    }));

    return transformedData;
  } catch (error) {
    throw new Error(`Failed to transform data: ${error.message}`);
  }
};

module.exports = { fetchDataFromThirdParty };
