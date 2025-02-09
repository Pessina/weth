import { useCallback, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  Safe4337CreateTransactionProps,
  Safe4337InitOptions,
  Safe4337Pack,
} from "@safe-global/relay-kit";
import SafeApiKit, {
  SafeMultisigTransactionListResponse,
} from "@safe-global/api-kit";
import { useEnv } from "./useEnv";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { withPolling } from "@/lib/utils";
import { Hex, withRetry } from "viem";
import { sepolia } from "viem/chains";
import { useSafeStore } from "@/stores/useSafeStore";
import { useWithError } from "./useWithError";

export type InitSafeFn = ({
  options,
}: {
  options: Safe4337InitOptions["options"];
}) => Promise<void>;

export const useSafe = () => {
  const { bundlerUrl, paymasterUrl } = useEnv();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [safeApiKit, setSafeApiKit] = useState<SafeApiKit | null>(null);
  const { safe4337Pack, setSafe4337Pack, reset } = useSafeStore();
  const queryClient = useQueryClient();
  const { withError } = useWithError();

  const getSafeExplorerLink = useCallback((address: string) => {
    return `https://app.safe.global/home?safe=sep:${address}`;
  }, []);

  const initSafe = useCallback<InitSafeFn>(
    async ({ options }) => {
      return withError(
        async () => {
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
                paymasterUrl,
              },
              options,
            })
          );

          queryClient.invalidateQueries({ queryKey: ["safeAddress"] });
        },
        {
          successMessage: "Safe initialized successfully",
          errorMessage: "Failed to initialize Safe",
        }
      );
    },
    [
      bundlerUrl,
      paymasterUrl,
      queryClient,
      setSafe4337Pack,
      walletClient,
      withError,
    ]
  );

  const { data: safeAddress, isLoading: isAddressLoading } = useQuery({
    queryKey: ["safeAddress", safe4337Pack],
    queryFn: async () => {
      if (!safe4337Pack) return null;

      return safe4337Pack.protocolKit.getAddress();
    },
  });

  const { data: isSafeDeployed, isLoading: isDeploymentStatusLoading } =
    useQuery({
      queryKey: ["isSafeDeployed", safeAddress],
      queryFn: async () => {
        if (!safe4337Pack) return false;

        return safe4337Pack.protocolKit.isSafeDeployed();
      },
    });

  const { data: ethBalance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["ethBalance", safeAddress],
    queryFn: async () => {
      if (!safe4337Pack) return 0n;

      const balance = await safe4337Pack.protocolKit.getBalance();

      return balance ?? 0n;
    },
    refetchInterval: 1000,
  });

  const { data: pendingTransactions, isLoading: isTransactionsLoading } =
    useQuery<SafeMultisigTransactionListResponse | undefined>({
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

  const deploySafe = useCallback(async () => {
    return withError(
      async () => {
        if (!safe4337Pack || !walletClient)
          throw new Error("Safe not initialized");

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
      },
      {
        successMessage: "Safe deployed successfully",
        errorMessage: "Failed to deploy Safe",
      }
    );
  }, [publicClient, safe4337Pack, walletClient, refetchSafeQueries, withError]);

  const signSafeProposal = useCallback(
    async (safeTxHash: string) => {
      return withError(
        async () => {
          if (!safe4337Pack) {
            throw new Error("Safe not initialized");
          }

          const signature = await safe4337Pack.protocolKit.signHash(safeTxHash);
          await safeApiKit?.confirmTransaction(safeTxHash, signature.data);
          refetchSafeQueries();
        },
        {
          successMessage: "Proposal signed successfully",
          errorMessage: "Failed to sign proposal",
        }
      );
    },
    [safe4337Pack, safeApiKit, refetchSafeQueries, withError]
  );

  const createSafeProposal = useCallback(
    async (transactions: Safe4337CreateTransactionProps["transactions"]) => {
      return withError(
        async () => {
          if (!safe4337Pack || !walletClient || !safeAddress)
            throw new Error("Safe not initialized");

          // TODO: If this is called right after send a tx it can be out of sync.
          const nextNonce = (await safeApiKit?.getSafeInfo(safeAddress))?.nonce;

          if (!nextNonce) throw new Error("Failed to get next nonce");

          const safeTransaction =
            await safe4337Pack.protocolKit.createTransaction({
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
        {
          successMessage: "Proposal created successfully",
          errorMessage: "Failed to create proposal",
        }
      );
    },
    [
      safe4337Pack,
      safeAddress,
      safeApiKit,
      walletClient,
      refetchSafeQueries,
      withError,
    ]
  );

  const executeSafeProposal = useCallback(
    async (safeTxHash: string) => {
      return withError(
        async () => {
          if (!safe4337Pack || !safeAddress)
            throw new Error("Safe not initialized");

          const safeTransaction = await safeApiKit?.getTransaction(safeTxHash);

          if (!safeTransaction) throw new Error("Transaction not found");

          const safe = await safe4337Pack.protocolKit.connect({
            provider: walletClient?.transport,
            safeAddress,
          });

          const result = await safe.executeTransaction(safeTransaction);

          if (!result) throw new Error("Transaction failed");

          await publicClient?.waitForTransactionReceipt({
            hash: result.hash as `0x${string}`,
          });

          refetchSafeQueries();
        },
        {
          successMessage: "Proposal executed successfully",
          errorMessage: "Failed to execute proposal",
        }
      );
    },
    [
      withError,
      safe4337Pack,
      safeAddress,
      safeApiKit,
      walletClient?.transport,
      publicClient,
      refetchSafeQueries,
    ]
  );

  const executeSafeTransaction = useCallback(
    async (transactions: Safe4337CreateTransactionProps["transactions"]) => {
      return withError(
        async () => {
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
        {
          successMessage: "Transaction executed successfully",
          errorMessage: "Failed to execute transaction",
        }
      );
    },
    [safe4337Pack, withError]
  );

  const initiateSafeTransaction = useCallback(
    async ({
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
          // Safe deployed, wait to be indexed
          const safeInfo = await withRetry(
            async () => await safeApiKit?.getSafeInfo(safeAddress ?? ""),
            {
              retryCount: 3,
              delay: 1000,
            }
          );

          if (!safeInfo) throw new Error("Safe not deployed");
        }

        if ((await safe4337Pack.protocolKit.getThreshold()) > 1) {
          await createSafeProposal(transactions);
        } else {
          await executeSafeTransaction(transactions);
        }

        refetchSafeQueries();

        return {
          receiptHash: "TODO: Fill with real values",
          safeOperationHash: "TODO: Fill with real values",
        };
      } catch (error) {
        console.error("Safe transaction failed:", error);
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
      safeAddress,
      safeApiKit,
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
    isAddressLoading,
    isDeploymentStatusLoading,
    isBalanceLoading,
    isTransactionsLoading,
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
