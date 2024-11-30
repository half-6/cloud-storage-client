export const isProd = process.env.NODE_ENV === "production";
export const isRenderer = () => process && process.type === "renderer";
