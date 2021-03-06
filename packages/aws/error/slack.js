const axios = require('axios');

const { getParameter } = require('../ssm/actions');
const { getRegion, getStage, isDev } = require('../env');

const errorHandler = (channel, options = {}) => (name) => async (error, payload = null) => {
  try {
    const {
      useSSM = false,
      encrypted = true,
    } = options;

    const channelUrl = useSSM ? await getParameter(channel, encrypted) : channel;

    const data = {
      name,
      stage: getStage(),
      region: getRegion(),
      error: (error && error.message) ? error.message : error,
      payload,
    };

    const text = JSON.stringify(data, null, 2);

    console.error(text); // eslint-disable-line

    if (!isDev()) {
      await axios.post(channelUrl, { text });
    }
  } catch (e) {
    console.error(e); // eslint-disable-line
  }
};

module.exports = errorHandler;
