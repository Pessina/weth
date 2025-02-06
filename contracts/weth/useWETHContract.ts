import {
  useWriteContract,
  useReadContract,
  Config,
  useAccount,
  usePublicClient,
} from "wagmi";
import { useCallback, useState } from "react";
import { Hex, parseEther } from "viem";
import { wethABI } from "./wethABI";
import { contractAddresses } from "@/constants/addresses";
import { useToast } from "@/hooks/use-toast";

const contractConfig = {
  abi: wethABI,
  address: contractAddresses.weth.sepolia,
};

export function useWETHContract() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isWriting, setIsWriting] = useState(false);

  const {
    data: balance,
    isError: isBalanceError,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract<
    typeof wethABI,
    "balanceOf",
    [address: Hex],
    Config,
    bigint
  >({
    ...contractConfig,
    functionName: "balanceOf",
    args: [address as Hex],
  });

  const refresh = useCallback(async () => {
    await refetchBalance();
  }, [refetchBalance]);

  const { writeContractAsync: writeContract } = useWriteContract();

  const deposit = useCallback(
    async (amount: number) => {
      setIsWriting(true);
      try {
        const hash = await writeContract({
          ...contractConfig,
          functionName: "deposit",
          value: parseEther(amount.toString()),
        });
        await publicClient?.waitForTransactionReceipt({ hash });
        await refresh();
        toast({
          title: "Deposit Successful",
          description: `Successfully deposited ${amount} ETH to WETH`,
        });
        return hash;
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Deposit Failed",
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

  const withdraw = useCallback(
    async (amount: number) => {
      setIsWriting(true);
      try {
        const hash = await writeContract({
          ...contractConfig,
          functionName: "withdraw",
          args: [parseEther(amount.toString())],
        });
        await publicClient?.waitForTransactionReceipt({ hash });
        await refresh();
        toast({
          title: "Withdrawal Successful",
          description: `Successfully withdrew ${amount} WETH to ETH`,
        });
        return hash;
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Withdrawal Failed",
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

  return {
    balance,
    isBalanceError,
    isBalanceLoading,
    refetchBalance,
    deposit,
    withdraw,
    isWriting,
  };
}
