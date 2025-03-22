const path = require("path");

module.exports = {
  webpack: (config) => {
    config.resolve.alias["@components"] = path.resolve(__dirname, "src/components");
    config.resolve.alias["@styles"] = path.resolve(__dirname, "src/styles");
    config.resolve.alias["@contexts"] = path.resolve(__dirname, "src/contexts");
    config.resolve.alias["@lib"] = path.resolve(__dirname, "src/lib");
    return config;
  },
};
