const crypto = require("crypto");
const Oauth1a = require("oauth-1.0a");
const axios = require("axios");
require('dotenv').config();

const api = async (options, headers = {}, body = {}) => {
  const authHeader = getAuthHeader(options);
  const { data } = await axios({
    ...options,
    data: body,
    headers: {
      ...authHeader,
      ...headers
    },
  });
  return data;
};

function getAuthHeader(request) {
  const oauth = new Oauth1a({
    consumer: { key: process.env.APP_KEY, secret: process.env.APP_SECRET },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  const authorize = oauth.authorize(request, {
    key: process.env.ACCESS_TOKEN,
    secret: process.env.ACCESS_TOKEN_SECRET,
  });

  return oauth.toHeader(authorize);
}

module.exports = {api};