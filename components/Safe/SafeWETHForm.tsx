import { useSafe } from "@/hooks/useSafe"
import { encodeFunctionData } from "viem"
import { wethABI } from "@/contracts/weth/wethABI"
import { contractAddresses } from "@/constants/addresses"
import { SafeInitForm } from "./SafeInitForm"
import { SafeDetails } from "./SafeDetails"
import { WETHAmountForm } from "@/components/WETHAmountForm"
import { useSafeStore } from "@/stores/useSafeStore"
import { SafePendingTransactions } from "./SafePendingTransactions"

export function SafeWETHForm() {
    const {
        safeAddress,
        isSafeDeployed,
        isLoading,
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
    const { setOnGoingSafeOperationHash } = useSafeStore();

    async function handleWrap(amount: bigint): Promise<void> {
        // TODO: This should be implemented on the useWETHContract hook
        const depositData = encodeFunctionData({
            abi: wethABI,
            functionName: 'deposit'
        });

        const { receiptHash, safeOperationHash } = await initiateSafeTransaction({
            transactions: [{
                to: contractAddresses.weth.sepolia,
                data: depositData,
                value: amount.toString()
            }]
        });
        setOnGoingSafeOperationHash(safeOperationHash);

        console.log(receiptHash, safeOperationHash);

        // TODO: Refetch queries here or inside the initiateSafeTransaction hook
    }

    async function handleUnwrap(amount: bigint): Promise<void> {
        // TODO: This should be implemented on the useWETHContract hook
        const withdrawData = encodeFunctionData({
            abi: wethABI,
            functionName: 'withdraw',
            args: [amount]
        });

        const { receiptHash, safeOperationHash } = await initiateSafeTransaction({
            transactions: [{
                to: contractAddresses.weth.sepolia,
                data: withdrawData,
                value: "0"
            }]
        });
        setOnGoingSafeOperationHash(safeOperationHash);

        console.log(receiptHash, safeOperationHash);

        // TODO: Refetch queries here or inside the initiateSafeTransaction hook
    }

    if (!safeAddress) {
        return <SafeInitForm isLoading={isLoading} initSafe={initSafe} />
    }

    return (
        <div className="space-y-4 pt-4">
            <SafeDetails
                disconnect={resetSafe}
                ethBalance={ethBalance ?? 0n}
                safeAddress={safeAddress}
                isSafeDeployed={isSafeDeployed ?? false}
                getSafeExplorerLink={getSafeExplorerLink}
            />
            <SafePendingTransactions
                pendingTransactions={pendingTransactions}
                signSafeProposal={signSafeProposal}
                createSafeProposal={createSafeProposal}
                executeSafeProposal={executeSafeProposal}
            />
            <WETHAmountForm
                isLoading={isLoading}
                onWrap={handleWrap}
                onUnwrap={handleUnwrap}
            />
        </div>
    )
} 