/** @type {import('next').NextConfig} */
const path = require("path");
const folderPaths = [
  path.resolve(__dirname, "../shared/"),
  path.resolve(__dirname, "../shared/types"),
  path.resolve(__dirname, "../shared/storageClient"),
  path.resolve(__dirname, "../shared/utility"),
  path.resolve(__dirname, "../shared/utility/file-type"),
];
const rules = [
  {
    test: /\.tsx?$/,
    exclude: /^node_modules/,
    loader: "ts-loader",
    include: [folderPaths],
    options: {
      transpileOnly: true,
    },
  },
  // {
  //   test: /\.node$/,
  //   loader: "node-loader",
  // },
];
module.exports = {
  output: "export",
  distDir: process.env.NODE_ENV === "production" ? "../app" : ".next",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // webpack: (config) => {
  //   return config;
  // },
  webpack: (config, { isServer }) => {
    // config.resolve.plugins = [
    //   new TsconfigPathsPlugin({
    //     configFile: path.resolve(cwd, "tsconfig.json"),
    //   }),
    // ];
    // if (!isServer) {
    //   config.target = "electron-renderer";
    // }
    config.module.rules = [...config.module.rules, ...rules];
    return config;
  },
};
