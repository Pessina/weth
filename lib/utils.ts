import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const splitAddress = (
  address: string,
  charDisplayed: number = 6
): string => {
  const firstPart = address.slice(0, charDisplayed);
  const lastPart = address.slice(address.length - charDisplayed);
  return `${firstPart}...${lastPart}`;
};

export const withPolling = async <T>(
  fn: () => Promise<T | null>,
  options: {
    interval: number;
    timeout: number;
  }
): Promise<T> => {
  const startTime = Date.now();
  let timeoutId: NodeJS.Timeout;
  let isTimedOut = false;

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeoutId);
      isTimedOut = true;
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Polling timed out"));
    }, options.timeout);

    const poll = async () => {
      if (isTimedOut) return;

      try {
        const result = await fn();
        if (result) {
          cleanup();
          resolve(result);
        } else if (!isTimedOut && Date.now() - startTime < options.timeout) {
          setTimeout(poll, options.interval);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    poll();
  });
};
