/** @type {import('next').NextConfig} */
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
    // if (!isServer) {
    //config.target = "electron-renderer";
    // }
    return config;
  },
};
