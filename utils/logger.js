export const logger = {
  info: (msg, data) => {
    console.log(`${msg}`, data || "");
  },
  warn: (msg, data) => {
    console.warn(`${msg}`, data || "");
  },
  error: (msg, data) => {
    console.error(`${msg}`, data || "");
  },
};
