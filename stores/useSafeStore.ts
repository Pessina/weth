import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Safe4337Pack } from "@safe-global/relay-kit";

interface SafeState {
  onGoingSafeOperationHash: string | null;
  safe4337Pack: Safe4337Pack | null;
  setSafe4337Pack: (pack: Safe4337Pack | null) => void;
  setOnGoingSafeOperationHash: (hash: string | null) => void;
  reset: () => void;
}

export const useSafeStore = create<SafeState>()(
  persist(
    (set) => ({
      onGoingSafeOperationHash: null,
      safe4337Pack: null,
      setSafe4337Pack: (pack) => set({ safe4337Pack: pack }),
      setOnGoingSafeOperationHash: (hash) =>
        set({ onGoingSafeOperationHash: hash }),
      reset: () => set({ onGoingSafeOperationHash: null, safe4337Pack: null }),
    }),
    {
      name: "safe-storage",
      partialize: (state) => ({
        onGoingSafeOperationHash: state.onGoingSafeOperationHash,
        safe4337Pack: state.safe4337Pack,
      }),
    }
  )
);
