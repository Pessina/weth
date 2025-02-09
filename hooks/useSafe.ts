import { useCallback, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  Safe4337CreateTransactionProps,
  Safe4337Pack,
} from "@safe-global/relay-kit";
import SafeApiKit, {
  SafeMultisigTransactionListResponse,
} from "@safe-global/api-kit";
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
  const publicClient = usePublicClient();
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

      setSafe4337Pack(
        await Safe4337Pack.init({
          provider: walletClient?.transport,
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

  const { data: pendingTransactions } = useQuery<
    SafeMultisigTransactionListResponse | undefined
  >({
    queryKey: ["transactions", safeAddress],
    queryFn: async () => {
      return safeApiKit?.getPendingTransactions(safeAddress ?? "");
    },
    enabled: !!safeAddress,
  });

  const refetchSafeQueries = useCallback(() => {
    // TODO: This should target only the related queries
    queryClient.invalidateQueries({ refetchType: "all" });
  }, [queryClient]);

  // TODO Add error handling
  const deploySafe = useCallback(async () => {
    if (!safe4337Pack || !walletClient) throw new Error("Safe not initialized");

    const deploymentTransaction =
      await safe4337Pack.protocolKit.createSafeDeploymentTransaction();

    const txHash = await walletClient?.sendTransaction({
      to: deploymentTransaction.to,
      value: BigInt(deploymentTransaction.value),
      data: deploymentTransaction.data as `0x${string}`,
    });

    if (!txHash) throw new Error("Transaction failed");

    const receipt = await publicClient?.waitForTransactionReceipt({
      hash: txHash,
    });

    refetchSafeQueries();
    return receipt;
  }, [publicClient, safe4337Pack, walletClient, refetchSafeQueries]);

  // TODO Add error handling
  const signSafeProposal = useCallback(
    async (safeTxHash: string) => {
      if (!safe4337Pack) {
        throw new Error("Safe not initialized");
      }

      const signature = await safe4337Pack.protocolKit.signHash(safeTxHash);
      await safeApiKit?.confirmTransaction(safeTxHash, signature.data);
      refetchSafeQueries();
    },
    [safe4337Pack, safeApiKit, refetchSafeQueries]
  );

  // TODO Add error handling
  const createSafeProposal = useCallback(
    async (transactions: Safe4337CreateTransactionProps["transactions"]) => {
      if (!safe4337Pack || !walletClient || !safeAddress)
        throw new Error("Safe not initialized");

      const nextNonce = (await safeApiKit?.getSafeInfo(safeAddress))?.nonce;

      if (!nextNonce) throw new Error("Failed to get next nonce");

      const safeTransaction = await safe4337Pack.protocolKit.createTransaction({
        transactions: await Promise.all(
          transactions.map(async (tx, index) => ({
            ...tx,
            nonce: (BigInt(nextNonce) + BigInt(index)).toString(),
          }))
        ),
      });

      const safeTxHash = await safe4337Pack.protocolKit.getTransactionHash(
        safeTransaction
      );

      const signature = await safe4337Pack.protocolKit.signHash(safeTxHash);

      await safeApiKit?.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress: walletClient?.account.address,
        senderSignature: signature.data,
      });

      refetchSafeQueries();
    },
    [safe4337Pack, safeAddress, safeApiKit, walletClient, refetchSafeQueries]
  );

  // TODO Add error handling
  const executeSafeProposal = useCallback(
    async (safeTxHash: string) => {
      if (!safe4337Pack || !safeAddress)
        throw new Error("Safe not initialized");

      const safeTransaction = await safeApiKit?.getTransaction(safeTxHash);

      if (!safeTransaction) throw new Error("Transaction not found");

      // TODO: This is likely not needed, but without it I'm getting error "Safe is not deployed", while the bool isSafeDeployed is true.
      // This error is causes because the contractManager on protocol kit is undefined
      const safe = await safe4337Pack.protocolKit.connect({
        provider: walletClient?.transport,
        safeAddress,
      });

      await safe.executeTransaction(safeTransaction);
      refetchSafeQueries();
    },
    [
      safe4337Pack,
      safeAddress,
      safeApiKit,
      walletClient?.transport,
      refetchSafeQueries,
    ]
  );

  const executeSafeTransaction = useCallback(
    async (transactions: Safe4337CreateTransactionProps["transactions"]) => {
      if (!safe4337Pack) throw new Error("Safe not initialized");

      const safeOperation = await safe4337Pack.createTransaction({
        transactions,
      });

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
          timeout: 20 * 1000,
        }
      );

      if (!receipt?.success) {
        throw new Error("Transaction failed");
      }

      return {
        receiptHash: receipt.receipt.transactionHash as Hex,
        safeOperationHash: safeOperation.getHash(),
      };
    },
    [safe4337Pack]
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

        if (!isSafeDeployed) {
          await deploySafe();
        }

        if ((await safe4337Pack.protocolKit.getThreshold()) > 1) {
          await createSafeProposal(transactions);
        } else {
          await executeSafeTransaction(transactions);
        }

        toast({
          title: "Transaction successful",
          description: "Transaction executed successfully",
        });

        refetchSafeQueries();

        return {
          receiptHash: "TODO: Fill with real values",
          safeOperationHash: "TODO: Fill with real values",
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
      createSafeProposal,
      deploySafe,
      executeSafeTransaction,
      isSafeDeployed,
      refetchSafeQueries,
      safe4337Pack,
      toast,
    ]
  );

  const resetSafe = useCallback(() => {
    reset();
    // TODO: Should target only the related queries
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
    resetSafe,
    pendingTransactions,
    deploySafe,
    signSafeProposal,
    createSafeProposal,
    executeSafeProposal,
  };
};
