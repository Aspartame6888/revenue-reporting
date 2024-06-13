const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const logger = require("./config/logger");
const dataRoutes = require("./routes/data");
const config = require("./config/config");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(bodyParser.json());
app.use("/api", dataRoutes);

require("./jobs/scheduledTask");

app.listen(config.PORT, () => {
  logger.info(`Server is running on port ${config.PORT}`);
});
