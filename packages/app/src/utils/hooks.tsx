import {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  ChangeEventHandler
} from "react";

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

export function useInputValueChangeHandler(
  setter: (value: string) => void
): ChangeEventHandler<HTMLInputElement> {
  return useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setter(value);
    },
    [setter]
  );
}

interface UseDataFetchingResult<SearchResult> {
  result: SearchResult;
  loading: boolean;
}

export function useDataFetching<SearchResult, SearchParams, DebouncedParams>(
  fetchFunction: (
    params: SearchParams,
    debouncedParams: DebouncedParams
  ) => Promise<SearchResult>,
  params: SearchParams,
  debouncedParams: DebouncedParams,
  delay: number
): UseDataFetchingResult<SearchResult | null> {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    setLoading(true);
  }, [params, debouncedParams]);
  useDebounceEffect(
    debouncedParams,
    delay,
    debouncedParams => {
      fetchFunction(params, debouncedParams).then(fetchedResults => {
        setResult(fetchedResults);
        setLoading(false);
      });
    },
    [fetchFunction, params]
  );

  return {
    result,
    loading
  };
}
