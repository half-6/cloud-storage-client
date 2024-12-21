export function replaceFromEnd(str, search, replace) {
  const lastIndex = str.lastIndexOf(search);
  if (lastIndex !== -1) {
    return (
      str.slice(0, lastIndex) + replace + str.slice(lastIndex + search.length)
    );
  }
  return str;
}

export function deepClone(objectToCopy: any) {
  return JSON.parse(JSON.stringify(objectToCopy));
}

/**
 * Convert object to array
 * Example: { a: 1, b: 2, c: 3 }
 * To: [{key:"a",value:1},{key:"b",value:2},{key:"c",value:3}]
 * @param obj
 */
export function obj2array(obj: any) {
  if (!obj) return [];
  const keys = Object.keys(obj);
  return keys.map((key) => ({
    key,
    value: obj[key],
  }));
}

export async function asyncFilter(array: any[], predicate) {
  const results = await Promise.all(array.map(predicate));
  return array.filter((_, index) => results[index]);
}

export function chunkArray(a: any[], n: number) {
  return Array.from({ length: Math.ceil(a.length / n) }, (_, i) =>
    a.slice(i * n, i * n + n),
  );
}

export async function promiseAllInBatches(promises: any[], batchSize: number) {
  const res = [];
  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch);
    // Process the results of this batch
    res.push(...results);
  }
  return res;
}

export function isIpcReady() {
  return typeof window !== "undefined" && window.ipc;
}
