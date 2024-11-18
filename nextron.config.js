const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const path = require("path");
const cwd = process.cwd();

module.exports = {
  // mainSrcDir: "main",
  // rendererSrcDir: "renderer",
  webpack: (config) => {
    // config.resolve.plugins = [
    //   new TsconfigPathsPlugin({
    //     configFile: path.resolve(cwd, "tsconfig.json"),
    //   }),
    // ];
    // config.entry = {
    //   background: "./main/background.ts",
    // };
    return config;
  },
};
