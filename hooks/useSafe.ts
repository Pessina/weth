import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import {
  Safe4337CreateTransactionProps,
  Safe4337Pack,
  SponsoredPaymasterOption,
} from "@safe-global/relay-kit";
import { useEnv } from "./useEnv";

const DEFAULT_CHAR_DISPLAYED = 6;

const splitAddress = (
  address: string,
  charDisplayed: number = DEFAULT_CHAR_DISPLAYED
): string => {
  const firstPart = address.slice(0, charDisplayed);
  const lastPart = address.slice(address.length - charDisplayed);
  return `${firstPart}...${lastPart}`;
};

export const useSafe = () => {
  const { paymasterAddress, bundlerUrl, paymasterUrl } = useEnv();
  const { address: walletAddress } = useAccount();
  const [safeAddress, setSafeAddress] = useState<string>();
  const [isSafeDeployed, setIsSafeDeployed] = useState<boolean>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getSafeExplorerLink = useCallback((address: string) => {
    return `https://app.safe.global/home?safe=sep:${address}`;
  }, []);

  const initSafe4337Pack = useCallback(async () => {
    if (!walletAddress) return null;

    const paymasterOptions = {
      isSponsored: true,
      paymasterAddress: paymasterAddress,
      paymasterUrl: paymasterUrl,
    } as SponsoredPaymasterOption;

    return await Safe4337Pack.init({
      provider: window.ethereum,
      signer: walletAddress,
      bundlerUrl: bundlerUrl,
      paymasterOptions,
      options: {
        owners: [walletAddress],
        threshold: 1,
      },
    });
  }, [bundlerUrl, paymasterAddress, paymasterUrl, walletAddress]);

  const initiateSafeTransaction = useCallback(
    async (
      safe4337CreateTransactionProps: Safe4337CreateTransactionProps
    ): Promise<string> => {
      setIsLoading(true);
      try {
        const safe4337Pack = await initSafe4337Pack();
        if (!safe4337Pack) throw new Error("Failed to initialize Safe");

        const safeAddr = await safe4337Pack.protocolKit.getAddress();
        setSafeAddress(safeAddr);

        const isDeployed = await safe4337Pack.protocolKit.isSafeDeployed();
        setIsSafeDeployed(isDeployed);

        const safeOperation = await safe4337Pack.createTransaction(
          safe4337CreateTransactionProps
        );

        const signedSafeOperation = await safe4337Pack.signSafeOperation(
          safeOperation
        );

        const userOpHash = await safe4337Pack.executeTransaction({
          executable: signedSafeOperation,
        });

        return userOpHash;
      } catch (error) {
        if (error instanceof Error && error.message.includes("0x08c379a0")) {
          const errorData = error.message.match(/0x08c379a0[a-fA-F0-9]*/)?.[0];
          if (errorData) {
            const encodedMessage = errorData.slice(138, -64); // Remove padding
            const decodedMessage = Buffer.from(
              encodedMessage,
              "hex"
            ).toString();
            console.error("Safe transaction failed:", decodedMessage);
            throw new Error(decodedMessage);
          }
        }
        console.error("Safe transaction failed:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [initSafe4337Pack]
  );

  return {
    safeAddress,
    isSafeDeployed,
    isLoading,
    initiateSafeTransaction,
    getSafeExplorerLink,
    splitAddress,
  };
};
