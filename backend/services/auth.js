const axios = require("axios");
const config = require("../config/config");

const getAccessToken = async () => {
  const tokenUrl = "https://backstage.taboola.com/backstage/oauth/token";
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", config.clientId);
  params.append("client_secret", config.clientSecret);

  try {
    const response = await axios.post(tokenUrl, params);
    return response.data.access_token;
  } catch (error) {
    throw new Error(`Failed to get access token: ${error.message}`);
  }
};

module.exports = { getAccessToken };
