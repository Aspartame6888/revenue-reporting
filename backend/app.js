const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');
const logger = require('./config/logger');
const bodyParser = require('body-parser');
const dataRoutes = require('./routes/data');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5008;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
// app.use('/api/data', dataRoutes);
app.use(bodyParser.json());
app.use('/api', dataRoutes);

const thirdPartyApi1 = 'https://api.example.com/data';
const thirdPartyApi2 = 'https://api.example2.com/submit';

// 定时任务：每天一次
schedule.scheduleJob('0 0 * * *', async () => {
  try {
    const response = await axios.get(thirdPartyApi1);
    const data = response.data;
    
    await axios.post(thirdPartyApi2, data);
    logger.info('Data sent successfully.');
  } catch (error) {
    logger.error(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
