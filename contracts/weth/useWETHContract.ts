import {
  Config,
  useWriteContract,
  useReadContract,
  usePublicClient,
} from "wagmi";
import { useCallback, useState } from "react";
import { Hex } from "viem";
import { wethABI } from "./wethABI";
import { contractAddresses } from "@/constants/addresses";
import { useWithError } from "@/hooks/useWithError";

const contractConfig = {
  abi: wethABI,
  address: contractAddresses.weth.sepolia,
} as const;

type WETHAction = {
  writeContractArgs: {
    functionName: string;
    amount: bigint;
    args?: unknown[];
    value?: bigint;
  };
  messages: {
    successMessage: string;
    errorTitle: string;
  };
};

type UseWETHContractProps = {
  address?: string;
  refreshQueries?: () => Promise<void>;
};

export function useWETHContract({
  address,
  refreshQueries,
}: UseWETHContractProps) {
  const publicClient = usePublicClient();
  const { withError } = useWithError();
  const [isWriting, setIsWriting] = useState(false);

  const {
    data: wethBalance,
    isLoading: isWETHBalanceLoading,
    refetch: refetchWETHBalance,
  } = useReadContract<typeof wethABI, "balanceOf", [Hex], Config, bigint>({
    ...contractConfig,
    functionName: "balanceOf",
    args: [address],
    query: {
      refetchInterval: 1000,
    },
  });

  const refresh = useCallback(async () => {
    await refetchWETHBalance();
    await refreshQueries?.();
  }, [refetchWETHBalance, refreshQueries]);

  const { writeContractAsync: writeContract } = useWriteContract();

  const executeWETHAction = useCallback(
    async (action: WETHAction) => {
      setIsWriting(true);
      try {
        return await withError(
          async () => {
            const hash = await writeContract({
              ...contractConfig,
              ...action.writeContractArgs,
            });
            await publicClient?.waitForTransactionReceipt({ hash });
            await refresh();
            return hash;
          },
          {
            successMessage: action.messages.successMessage,
            errorMessage: action.messages.errorTitle,
          }
        );
      } finally {
        setIsWriting(false);
      }
    },
    [writeContract, refresh, publicClient, withError]
  );

  const deposit = useCallback(
    async (amount: bigint) =>
      executeWETHAction({
        writeContractArgs: {
          functionName: "deposit",
          amount,
          value: amount,
        },
        messages: {
          successMessage: `Successfully deposited ${amount} ETH to WETH`,
          errorTitle: "Deposit Failed",
        },
      }),
    [executeWETHAction]
  );

  const withdraw = useCallback(
    async (amount: bigint) =>
      executeWETHAction({
        writeContractArgs: {
          functionName: "withdraw",
          amount,
          args: [amount],
        },
        messages: {
          successMessage: `Successfully withdrew ${amount} WETH to ETH`,
          errorTitle: "Withdrawal Failed",
        },
      }),
    [executeWETHAction]
  );

  return {
    wethBalance,
    isWETHBalanceLoading,
    refetchWETHBalance,
    deposit,
    withdraw,
    isWriting,
  };
}
