import { useMemo } from "react";
import { z } from "zod";

const envSchema = z.object({
  rainbowAppName: z.string().min(1),
  rainbowProjectId: z.string().min(1),
});

export const useEnv = () => {
  const parsed = useMemo(
    () =>
      envSchema.safeParse({
        rainbowAppName: process.env.NEXT_PUBLIC_RAINBOW_APP_NAME,
        rainbowProjectId: process.env.NEXT_PUBLIC_RAINBOW_PROJECT_ID,
      }),
    []
  );

  if (!parsed.success) {
    throw new Error(
      "❌ Invalid environment variables: " + JSON.stringify(parsed.error.errors)
    );
  }

  return parsed.data;
};
