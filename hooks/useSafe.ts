import { useCallback, useState } from "react";
import { useWalletClient } from "wagmi";
import {
  Safe4337CreateTransactionProps,
  Safe4337Pack,
} from "@safe-global/relay-kit";
import SafeApiKit from "@safe-global/api-kit";
import { useEnv } from "./useEnv";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { withPolling } from "@/lib/utils";
import { Hex } from "viem";
import { sepolia } from "viem/chains";
import { useSafeStore } from "@/stores/useSafeStore";

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
  const [safeApiKit, setSafeApiKit] = useState<SafeApiKit | null>(null);
  const { toast } = useToast();
  const { safe4337Pack, setSafe4337Pack, reset } = useSafeStore();
  const queryClient = useQueryClient();

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

      console.log(options);

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

      queryClient.invalidateQueries({ queryKey: ["safeAddress"] });
    },
    [bundlerUrl, paymasterUrl, queryClient, setSafe4337Pack, walletClient]
  );

  const { data: safeAddress } = useQuery({
    queryKey: ["safeAddress", safe4337Pack],
    queryFn: async () => {
      if (!safe4337Pack) return null;

      return safe4337Pack.protocolKit.getAddress();
    },
  });

  const { data: isSafeDeployed } = useQuery({
    queryKey: ["isSafeDeployed", safeAddress],
    queryFn: async () => {
      if (!safe4337Pack) return false;

      return safe4337Pack.protocolKit.isSafeDeployed();
    },
  });

  const { data: ethBalance } = useQuery({
    queryKey: ["ethBalance", safeAddress],
    queryFn: async () => {
      if (!safe4337Pack) return 0n;

      const balance = await safe4337Pack.protocolKit.getBalance();

      return balance ?? 0n;
    },
  });

  const getTxConfirmations = useCallback(
    async ({ safeTxHash }: { safeTxHash: string }) => {
      if (!safe4337Pack) return 0;
      const transaction = await safeApiKit?.getTransaction(safeTxHash);

      return transaction?.confirmations;
    },
    [safe4337Pack, safeApiKit]
  );

  const hasEnoughConfirmations = useCallback(
    async ({ safeTxHash }: { safeTxHash: string }) => {
      if (!safe4337Pack) return false;
      const transaction = await safeApiKit?.getTransaction(safeTxHash);

      if (!transaction || !transaction.confirmations) return false;

      return (
        transaction.confirmations?.length >= transaction.confirmationsRequired
      );
    },
    [safe4337Pack, safeApiKit]
  );

  const initiateSafeTransaction = useCallback(
    async ({
      // TODO: This should be more configurable, by the caller instead of limit to only transactions
      transactions,
    }: {
      transactions: Safe4337CreateTransactionProps["transactions"];
    }): Promise<{
      receiptHash: string;
      safeOperationHash: string;
    }> => {
      setIsLoading(true);
      try {
        if (!safe4337Pack) throw new Error("Safe not initialized");

        const safeTransaction =
          await safe4337Pack.protocolKit.createTransaction({
            transactions,
          });

        const safeOperation = await safe4337Pack.createTransaction({
          transactions,
        });

        const signedSafeOperation = await safe4337Pack.signSafeOperation(
          safeOperation
        );

        const isExecutable = await hasEnoughConfirmations({
          safeTxHash: safeOperation.getHash(),
        });

        if (!isExecutable) {
          if (!safeAddress || !walletClient?.account.address) {
            throw new Error("Safe address not found");
          }

          await safeApiKit?.proposeTransaction({
            safeAddress,
            safeTransactionData: safeTransaction.data,
            safeTxHash: safeOperation.getHash(),
            senderAddress: walletClient?.account.address,
            senderSignature: signedSafeOperation.encodedSignatures(),
          });

          console.log("Proposal sent");
          return {
            receiptHash: "",
            safeOperationHash: safeOperation.getHash(),
          };
        }

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
    [
      hasEnoughConfirmations,
      safe4337Pack,
      safeAddress,
      safeApiKit,
      toast,
      walletClient?.account.address,
    ]
  );

  const resetSafe = useCallback(() => {
    reset();
    // TODO: Should targe only the related queries
    queryClient.invalidateQueries({ refetchType: "all" });
  }, [queryClient, reset]);

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
    resetSafe,
  };
};
