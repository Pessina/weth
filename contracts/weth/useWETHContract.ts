import { useWriteContract, useReadContract } from "wagmi";
import { useCallback } from "react";
import { Hex, parseEther } from "viem";
import { wethABI } from "./wethABI";
import { contractAddresses } from "@/constants/addresses";

const contractConfig = {
  abi: wethABI,
  address: contractAddresses.weth.sepolia,
};

export function useWETHContract({ account }: { account: Hex }) {
  const {
    data: balance,
    isError: balanceError,
    isLoading: balanceLoading,
  } = useReadContract({
    ...contractConfig,
    functionName: "balanceOf",
    args: [account],
  });

  const { writeContractAsync: writeContract } = useWriteContract();

  // TODO: Include toast here on error
  const deposit = useCallback(
    async (amount: number) => {
      await writeContract({
        ...contractConfig,
        functionName: "deposit",
        value: parseEther(amount.toString()),
      });
    },
    [writeContract]
  );

  const withdraw = useCallback(
    async (amount: number) => {
      const hash = await writeContract({
        ...contractConfig,
        functionName: "withdraw",
        args: [parseEther(amount.toString())],
      });
      return hash;
    },
    [writeContract]
  );

  return {
    balance,
    balanceError,
    balanceLoading,
    deposit,
    withdraw,
  };
}
