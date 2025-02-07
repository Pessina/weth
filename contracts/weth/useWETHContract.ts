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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isWriting, setIsWriting] = useState(false);

  const {
    data: wethBalance,
    isLoading: isWETHBalanceLoading,
    refetch: refetchWETHBalance,
  } = useReadContract<typeof wethABI, "balanceOf", [Hex], Config, bigint>({
    ...contractConfig,
    functionName: "balanceOf",
    args: [address],
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
        const hash = await writeContract({
          ...contractConfig,
          ...action.writeContractArgs,
        });
        await publicClient?.waitForTransactionReceipt({ hash });
        await refresh();
        toast({
          title: `${action.writeContractArgs.functionName} Successful`,
          description: action.messages.successMessage,
        });
        return hash;
      } catch (error) {
        toast({
          variant: "destructive",
          title: action.messages.errorTitle,
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        throw error;
      } finally {
        setIsWriting(false);
      }
    },
    [writeContract, refresh, publicClient, toast]
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
