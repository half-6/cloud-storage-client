import { Resvg, ResvgRenderOptions } from "@resvg/resvg-js";

export function svgToPng(svg: string, width?: number) {
  const opts = {} as ResvgRenderOptions;
  if (width) {
    opts.fitTo = { mode: "width", value: width };
  }
  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  return pngData.asPng();
}

export function svgToPngDataurl(svg: string, width?: number) {
  const pngBuffer = svgToPng(svg, width);
  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}
