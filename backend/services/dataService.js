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

const regionMapping = {
  JP: "JP",
  TW: "TW",
  IT: "IT",
  FALLBACK: "FALLBACK",
  MX: "MX",
  EG: "EG",
  TR: "TR",
  GB: "GB",
  PL: "PL",
  ES: "ES",
  TH: "TH",
  FR: "FR",
  AU: "AU",
  "IN EN": "IN",
  AE: "AE",
  VN: "VN",
  CH: "CH",
  DE: "DE",
  PK: "PK",
  ID: "ID",
  NL: "NL",
  SG: "SG",
  SA: "SA",
  PT: "PT",
  "INDIA HINDI": "IN",
  PH: "PH",
  FALLBACK: "FALLBACK",
  "MY EN": "MY",
  BE: "BE",
  CO: "CO",
  "INDIA EN": "IN",
  MA: "MA",
  GR: "GR",
  MY: "MY",
  "IN MIX": "IN",
  IE: "IE",
  AR: "AR",
  PHILIPPINES: "PH",
  AT: "AT",
  "MALAYSIA EN": "MY",
  "INDIA TAMIL": "IN",

  FI: "FI",
  "INDIA MARATHI": "IN",
  SE: "SE",
  DK: "DK",
  LU: "LU",
  THAILAND: "TH",
  "ARABIC FALLBACK": "FALLBACK",
  "SPANISH FALLBACK LATAM": "FALLBACK",
  "MALAYSIA MALAY": "MY",
  "ENGLISH FALLBACK": "FALLBACK",
  "GERMAN FALLBACK": "FALLBACK",
  "FRENCH FALLBACK": "FALLBACK",
  "SPANISH FALLBACK": "FALLBACK",
  "ITALIAN FALLBACK": "FALLBACK",
  INDONESIA: "ID",
  "PORTUGUESE FALLBACK": "FALLBACK",
  TC: "TC",
  TO: "TO",
  PS: "PS",
  CK: "CK",
  SD: "SD",
  UM: "UM",
  FO: "FO",
  CW: "CW",
  HN: "HN",
  LB: "LB",
  LA: "LA",
  HR: "HR",
  BS: "BS",
  NU: "NU",
  BM: "BM",
  KZ: "KZ",
  CM: "CM",
  YE: "YE",
  BT: "BT",
  NG: "NG",
  US: "US",
  TL: "TL",
  SV: "SV",
  PM: "PM",
  DE: "DE",
  NZ: "NZ",
  SC: "SC",
  PE: "PE",
  MQ: "MQ",
  TN: "TN",
  EC: "EC",
  BA: "BA",
  PW: "PW",
  AM: "AM",
  MH: "MH",
  GH: "GH",
  ER: "ER",
  IQ: "IQ",
  NO: "NO",
  MM: "MM",
  GA: "GA",
  SY: "SY",
  CO: "CO",
  CV: "CV",
  MW: "MW",
  LC: "LC",
  QA: "QA",
  UG: "UG",
  ZM: "ZM",
  GQ: "GQ",
  CZ: "CZ",
  SR: "SR",
  IN: "IN",
  CC: "CC",
  SZ: "SZ",
  VG: "VG",
  RU: "RU",
  SK: "SK",
  LT: "LT",
  GD: "GD",
  LR: "LR",
  TD: "TD",
  CL: "CL",
  KG: "KG",
  PG: "PG",
  IL: "IL",
  GN: "GN",
  MG: "MG",
  FK: "FK",
  PN: "PN",
  CF: "CF",
  KI: "KI",
  NR: "NR",
  HU: "HU",
  AL: "AL",
  MK: "MK",
  VU: "VU",
  MU: "MU",
  KN: "KN",
  GM: "GM",
  KP: "KP",
  PR: "PR",
  UA: "UA",
  BD: "BD",
  PF: "PF",
  KR: "KR",
  TZ: "TZ",
  ET: "ET",
  AZ: "AZ",
  DO: "DO",
  BO: "BO",
  PER: "PER",
  SI: "SI",
  DM: "DM",
  NP: "NP",
  KH: "KH",
  BN: "BN",
  CX: "CX",
  KM: "KM",
  RS: "RS",
  BY: "BY",
  DJ: "DJ",
  MC: "MC",
  KE: "KE",
  ZA: "ZA",
  BW: "BW",
  KY: "KY",
  MS: "MS",
  TV: "TV",
  BR: "BR",
  EE: "EE",
  SB: "SB",
  AO: "AO",
  JM: "JM",
  CU: "CU",
  UY: "UY",
  VC: "VC",
  BI: "BI",
  GP: "GP",
  TK: "TK",
  AF: "AF",
  GU: "GU",
  AW: "AW",
  ZW: "ZW",
  AG: "AG",
  NA: "NA",
  PY: "PY",
  TT: "TT",
  RO: "RO",
  MP: "MP",
  FM: "FM",
  BG: "BG",
  AS: "AS",
  MO: "MO",
  BZ: "BZ",
  HT: "HT",
  TM: "TM",
  DZ: "DZ",
  NI: "NI",
  SH: "SH",
  MD: "MD",
  MZ: "MZ",
  LK: "LK",
  HK: "HK",
  LY: "LY",
  BH: "BH",
  TJ: "TJ",
  BL: "BL",
  VE: "VE",
  GY: "GY",
  KW: "KW",
  GI: "GI",
  WF: "WF",
  JO: "JO",
  LI: "LI",
  NC: "NC",
  RW: "RW",
  VI: "VI",
  GL: "GL",
  CA: "CA",
  AD: "AD",
  FJ: "FJ",
  CD: "CD",
  GE: "GE",
  PA: "PA",
  EG: "EG",
  TG: "TG",
  ST: "ST",
  RE: "RE",
  MN: "MN",
  SO: "SO",
  TF: "TF",
  NF: "NF",
  IO: "IO",
  MT: "MT",
  CY: "CY",
  CI: "CI",
  MV: "MV",
  MR: "MR",
  BJ: "BJ",
  SM: "SM",
  CG: "CG",
  LV: "LV",
  CHL: "CHL",
  LS: "LS",
  SN: "SN",
  MY: "MY",
  WS: "WS",
  GW: "GW",
  SL: "SL",
  AX: "AX",
  ML: "ML",
  BF: "BF",
  EH: "EH",
  GT: "GT",
  GR: "GR",
  VA: "VA",
  OM: "OM",
  IR: "IR",
  UZ: "UZ",
  NE: "NE",
  ME: "ME",
  CR: "CR",
  AI: "AI",
};

const mediaMapping = {
  "oppo-lockscreen": "Lockscreen",
  "oppo-browser": "Browser",
  "oneplus-lockscreen": "Lockscreen",
};

const transformData = (data, region, media) => {
  try {
    const results = data.results || [];
    const transformedData = results.map((result) => {
      // const income =
      //   result.total_revenue >= 1
      //    ? parseFloat(result.total_revenue).toFixed(2)
      //     : parseFloat("1.00").toFixed(2);
      let customApp = "API Lockscreen";
      if (mediaMapping[media] === "Browser") {
        customApp = "";
      }
      return {
        date: parseInt(result.date.split(" ")[0].replace(/-/g, "")),
        brand: "OPPO",
        model: "",
        region: regionMapping[region] || region,
        customId: "Taboola",
        media: mediaMapping[media] || media,
        currency: result._currency || "USD",
        income: Number(
          result.total_revenue >= 1
            ? parseFloat(result.total_revenue).toFixed(2)
            : parseFloat("1.00").toFixed(2)
        ),
        incomeType:
          region === "FALLBACK"
            ? "Fallback Content Income"
            : "Regular Content Income",
        customApp: customApp,
        impressions: result.total_impressions,
      };
    });
    return transformedData;
  } catch (error) {
    console.error("Error transforming data:", error);
    return [];
  }
};

module.exports = { fetchDataFromThirdParty };
