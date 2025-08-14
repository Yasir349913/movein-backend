// server.js
import "express-async-errors";
import app from "./app.js";
import { env } from "./config/index.js";
import { StartupService } from "./services/startup.service.js";

const startServer = async () => {
  try {
    // Initialize all services
    await StartupService.initialize(app, env);

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`Server running at http://localhost:${env.PORT}`);
      console.log(`Docs UI http://localhost:${env.PORT}/docs`);
      console.log(`OpenAPI JSON http://localhost:${env.PORT}/api-spec/v3`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}`);

      server.close(async () => {
        try {
          await StartupService.shutdown();
          process.exit(0);
        } catch (error) {
          console.error("Shutdown failed:", error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();