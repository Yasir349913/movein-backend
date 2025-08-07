import "express-async-errors"; 
import app from "./app.js";
import { connectDB, env } from "./config/index.js";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      console.log(` Server running at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
