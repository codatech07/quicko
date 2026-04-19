const dotenv = require("dotenv");
const app = require("./app"); 
const connectDB = require("./config/db"); 
const dns = require("dns"); 

// [ENV_SETUP] Load .env variables
dotenv.config();

// [DNS_CONFIG] Set custom DNS servers
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// [SERVER_BOOT] Start server only after DB connection
const startServer = async () => {
  try {
    console.log("🔥 Server restarted");
    // [DB_CONNECT] Connect to MongoDB
    await connectDB();
    // [PORT] Define server port
    const PORT = process.env.PORT || 5000;
    // [HTTP_SERVER] Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    // [FATAL_ERROR] DB connection failed
    console.error("DB Connection Failed", err);
    // [EXIT] Stop process if DB fails
    process.exit(1);
  }
};

// [INIT] Start application
startServer();