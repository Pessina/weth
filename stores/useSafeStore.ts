import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Safe4337Pack } from "@safe-global/relay-kit";

interface SafeState {
  safe4337Pack: Safe4337Pack | null;
  setSafe4337Pack: (pack: Safe4337Pack | null) => void;
  reset: () => void;
}

export const useSafeStore = create<SafeState>()(
  persist(
    (set) => ({
      safe4337Pack: null,
      setSafe4337Pack: (pack) => set({ safe4337Pack: pack }),
      reset: () => set({ safe4337Pack: null }),
    }),
    {
      name: "safe-storage",
      partialize: (state) => ({
        safe4337Pack: state.safe4337Pack,
      }),
    }
  )
);
