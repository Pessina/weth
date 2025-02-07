import { useWETHContract } from "@/contracts/weth/useWETHContract"
import { WETHAmountForm } from "@/components/WETHAmountForm"
import { useAccount, useBalance } from "wagmi";
import { Balance } from "./Balance";
import { useCallback } from "react";

export function WalletWETHForm() {
    const { address } = useAccount();
    const { refetch: refetchETHBalance, } = useBalance({ address });
    const { data: ethBalance, isLoading: isEthBalanceLoading } = useBalance(
        { address }
    )

    const refreshQueries = useCallback(async () => {
        await refetchETHBalance();
    }, [refetchETHBalance]);

    const { deposit, withdraw, isWriting, wethBalance, isWETHBalanceLoading } = useWETHContract({
        address: address,
        refreshQueries: refreshQueries
    })

    return (
        <div className="space-y-4 pt-4">
            <Balance isLoading={isEthBalanceLoading} balance={ethBalance?.value ?? 0n} label="ETH" />
            <Balance isLoading={isWETHBalanceLoading} balance={wethBalance ?? 0n} label="WETH" />
            <WETHAmountForm
                isLoading={isWriting}
                // TODO: Consider use useCallback
                onWrap={async (amount) => {
                    await deposit(amount);
                }}
                onUnwrap={async (amount) => {
                    await withdraw(amount);
                }}
            />
        </div>
    )
} 