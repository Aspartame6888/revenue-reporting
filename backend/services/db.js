const mysql = require("mysql2/promise");
const config = require("../config/config");

let connection = null;
let connectionTimes = 0;

const connectDB = async () => {
  let retries = 0;
  const maxRetries = 5;
  while (!connection && retries < maxRetries) {
    try {
      connection = await mysql.createConnection({
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        // database: config.dbName,
      });
      connectionTimes += 1;
      console.log(`Connected to the database ${connectionTimes}`);
    } catch (error) {
      retries += 1;
      console.log(
        `Failed to connect to the database (Attempt ${retries}/${maxRetries}): ${error.message}`
      );

      if (retries >= maxRetries) {
        console.log("Max retries reached. Could not connect to the database.");
        throw new Error("Could not connect to the database.");
      } else {
        console.log(`Retrying to connect in ${retries * 2} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retries * 2000));
      }
    }
  }
  return connection;
};

const getStatus = async (name) => {
  console.log("getStatus from database");
  try {
    const connection = await connectDB();
    if (!connection) {
      return false;
    }
    const [rows] = await connection.query(
      "SELECT status FROM trc.publishers WHERE name = ?",
      [name]
    );
    await connection.end();
    return rows[0]?.status === "LIVE";
  } catch (error) {
    // console.error(`Failed to get status for ${name}: ${error.message}`);
    return false;
  }
};

module.exports = { connectDB, getStatus };
