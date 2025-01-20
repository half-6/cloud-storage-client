import React, { useRef } from "react";
import useSWR from "swr";
import * as ReactDOMServer from "react-dom/server";

export function useSWRAbort<Data = any, Error = any>(
  key: string[],
  fn?: (signal: AbortSignal, ...params) => Promise<Data>,
  options?: any,
) {
  const aborter = useRef<AbortController>();
  const abort = () => aborter.current?.abort();

  const res = useSWR<Data, Error>(
    key,
    (...args) => {
      aborter.current = new AbortController();
      return fn?.(aborter.current.signal, ...args);
    },
    options,
  );

  return { ...res, abort };
}

/**
 * let svg = getSVG(<FileTypeIcon />);
 * @param node
 */
export function getSVG(node: React.ReactNode) {
  let svg = ReactDOMServer.renderToString(node);
  // iconString = `<svg width="48" height="48" viewBox="0 0 24 24" data-testid="FolderOutlinedIcon"><path d="m9.17 6 2 2H20v10H4V6zM10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8z"></path></svg>`;
  // iconString = `<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>`;
  //const image = await svgToPng(iconString);
  svg = svg.slice(0, 4) + ` xmlns="http://www.w3.org/2000/svg"` + svg.slice(4);
  return svg;
}
