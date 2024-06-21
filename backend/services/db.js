const mysql = require("mysql2/promise");
const config = require("../config/config");

let connection;

const connectDB = async () => {
  if (!connection) {
    connection = await mysql.createConnection({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
    //   database: config.dbName,
    });

    console.log("Connected to the database.");
  }
  return connection;
};

const getStatus = async (name) => {
  try {
    const connection = await connectDB();
    const [rows] = await connection.query(
      "SELECT status FROM trc.publishers WHERE name = ?",
      [name]
    );
    return rows[0]?.status === "LIVE";
  } catch (error) {
    console.error(`Failed to get status for ${name}: ${error.message}`);
    return false;
  }
};

module.exports = { connectDB, getStatus };
