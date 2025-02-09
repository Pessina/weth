import { useSafe } from "@/hooks/useSafe"
import { encodeFunctionData } from "viem"
import { wethABI } from "@/contracts/weth/wethABI"
import { contractAddresses } from "@/constants/addresses"
import { SafeInitForm } from "./SafeInitForm"
import { SafeDetails } from "./SafeDetails"
import { WETHAmountForm } from "@/components/WETHAmountForm"
import { SafePendingTransactions } from "./SafePendingTransactions"

export function SafeWETHForm() {
    const {
        safeAddress,
        isSafeDeployed,
        isLoading,
        isAddressLoading,
        isDeploymentStatusLoading,
        isBalanceLoading,
        isTransactionsLoading,
        initiateSafeTransaction,
        initSafe,
        getSafeExplorerLink,
        ethBalance,
        resetSafe,
        pendingTransactions,
        signSafeProposal,
        createSafeProposal,
        executeSafeProposal,
    } = useSafe()

    async function handleWrap(amount: bigint): Promise<void> {
        const depositData = encodeFunctionData({
            abi: wethABI,
            functionName: 'deposit'
        });

        await initiateSafeTransaction({
            transactions: [{
                to: contractAddresses.weth.sepolia,
                data: depositData,
                value: amount.toString()
            }]
        });
    }

    async function handleUnwrap(amount: bigint): Promise<void> {
        const withdrawData = encodeFunctionData({
            abi: wethABI,
            functionName: 'withdraw',
            args: [amount]
        });

        await initiateSafeTransaction({
            transactions: [{
                to: contractAddresses.weth.sepolia,
                data: withdrawData,
                value: "0"
            }]
        });
    }

    if (!safeAddress) {
        return <SafeInitForm isLoading={isLoading} initSafe={initSafe} />
    }

    const isAnyLoading = isLoading || isAddressLoading || isDeploymentStatusLoading || isBalanceLoading || isTransactionsLoading;

    return (
        <div className="space-y-4 pt-4">
            <SafeDetails
                disconnect={resetSafe}
                ethBalance={ethBalance ?? 0n}
                safeAddress={safeAddress}
                isSafeDeployed={isSafeDeployed ?? false}
                isAddressLoading={isAddressLoading}
                isDeploymentStatusLoading={isDeploymentStatusLoading}
                isBalanceLoading={isBalanceLoading}
                getSafeExplorerLink={getSafeExplorerLink}
            />
            <SafePendingTransactions
                pendingTransactions={pendingTransactions}
                signSafeProposal={signSafeProposal}
                createSafeProposal={createSafeProposal}
                executeSafeProposal={executeSafeProposal}
                isLoading={isTransactionsLoading}
            />
            <WETHAmountForm
                isLoading={isAnyLoading}
                onWrap={handleWrap}
                onUnwrap={handleUnwrap}
            />
        </div>
    )
} 