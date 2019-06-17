import { useState, useEffect, useCallback } from "react";

export function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebounceEffect(
  value: any,
  delay: number,
  callback: (debouncedValue: any) => void,
  dep: any[]
) {
  const memoizedCallback = useCallback(callback, dep);

  const debouncedValue = useDebounce(value, delay);

  useEffect(() => memoizedCallback(debouncedValue), [
    debouncedValue,
    memoizedCallback
  ]);
}
