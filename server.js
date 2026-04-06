const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");
const dns = require("dns");
dotenv.config();
// dns servers
dns.setDefaultResultOrder("ipv4first");
// The server should run correctly after connecting to the database.
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT;

if (!PORT) {
  console.error("PORT is not defined");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
  } catch (err) {
    console.error("DB Connection Failed", err);
    process.exit(1);
  }
};
startServer();
