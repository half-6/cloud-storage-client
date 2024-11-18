import { useRef } from "react";
import useSWR from "swr";

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
