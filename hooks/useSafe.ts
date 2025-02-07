import { useCallback, useState } from "react";
import { useWalletClient } from "wagmi";
import {
  Safe4337CreateTransactionProps,
  Safe4337Pack,
} from "@safe-global/relay-kit";
import SafeApiKit from "@safe-global/api-kit";
import { useEnv } from "./useEnv";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { withPolling } from "@/lib/utils";
import { Hex } from "viem";
import { sepolia } from "viem/chains";

type SafeInitOptions = {
  owners: string[];
  threshold: number;
};

export type InitSafeFn = ({
  options,
}: {
  options: SafeInitOptions;
}) => Promise<void>;

export const useSafe = () => {
  const { bundlerUrl, paymasterUrl } = useEnv();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [safe4337Pack, setSafe4337Pack] = useState<Safe4337Pack | null>(null);
  const [safeApiKit, setSafeApiKit] = useState<SafeApiKit | null>(null);
  const { toast } = useToast();

  const getSafeExplorerLink = useCallback((address: string) => {
    return `https://app.safe.global/home?safe=sep:${address}`;
  }, []);

  const initSafe = useCallback<InitSafeFn>(
    async ({ options }) => {
      if (!walletClient) throw new Error("Wallet client not found");

      setSafeApiKit(
        new SafeApiKit({
          chainId: BigInt(sepolia.id),
        })
      );

      setSafe4337Pack(
        await Safe4337Pack.init({
          provider: walletClient?.transport,
          signer: walletClient?.account.address,
          bundlerUrl: bundlerUrl,
          paymasterOptions: {
            isSponsored: true,
            paymasterUrl: paymasterUrl,
          },
          options,
        })
      );
    },
    [bundlerUrl, paymasterUrl, walletClient]
  );

  const { data: safeAddress } = useQuery({
    queryKey: ["safeAddress", walletClient?.account.address],
    queryFn: async () => {
      return safe4337Pack?.protocolKit.getAddress();
    },
    enabled: !!safe4337Pack,
  });

  const { data: isSafeDeployed } = useQuery({
    queryKey: ["isSafeDeployed", safeAddress],
    queryFn: async () => {
      return safe4337Pack?.protocolKit.isSafeDeployed();
    },
    enabled: !!safe4337Pack,
  });

  const { data: ethBalance } = useQuery({
    queryKey: ["ethBalance", safeAddress],
    queryFn: async () => {
      if (!safeAddress) return 0n;
      return safe4337Pack?.protocolKit.getBalance();
    },
    enabled: !!safeAddress,
  });

  const getTxConfirmations = useCallback(
    async ({ safeTxHash }: { safeTxHash: string }) => {
      if (!safe4337Pack) return 0;
      const transaction = await safeApiKit?.getTransaction(safeTxHash);

      return transaction?.confirmations;
    },
    [safe4337Pack, safeApiKit]
  );

  const initiateSafeTransaction = useCallback(
    async (
      safe4337CreateTransactionProps: Safe4337CreateTransactionProps
    ): Promise<{
      receiptHash: string;
      safeOperationHash: string;
    }> => {
      setIsLoading(true);
      try {
        if (!safe4337Pack) throw new Error("Safe not initialized");

        const safeOperation = await safe4337Pack.createTransaction(
          safe4337CreateTransactionProps
        );

        const signedSafeOperation = await safe4337Pack.signSafeOperation(
          safeOperation
        );

        const userOpHash = await safe4337Pack.executeTransaction({
          executable: signedSafeOperation,
        });

        const receipt = await withPolling(
          () => safe4337Pack.getUserOperationReceipt(userOpHash),
          {
            interval: 1000,
            timeout: 15000,
          }
        );

        if (!receipt?.success) {
          throw new Error("Transaction failed");
        }

        toast({
          title: "Transaction successful",
          description: "Transaction executed successfully",
        });

        return {
          receiptHash: receipt.receipt.transactionHash as Hex,
          safeOperationHash: safeOperation.getHash(),
        };
      } catch (error) {
        console.error("Safe transaction failed:", error);
        toast({
          title: "Transaction failed",
          description: "Transaction failed",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [safe4337Pack, toast]
  );

  return {
    initSafe,
    safe4337Pack,
    safeAddress,
    isSafeDeployed,
    isLoading,
    initiateSafeTransaction,
    getSafeExplorerLink,
    ethBalance,
    getTxConfirmations,
  };
};
