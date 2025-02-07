import { useSafe } from "@/hooks/useSafe"
import { encodeFunctionData } from "viem"
import { wethABI } from "@/contracts/weth/wethABI"
import { contractAddresses } from "@/constants/addresses"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SafeInitForm } from "./SafeInitForm"
import { SafeDetails } from "./SafeDetails"
import { WETHAmountForm } from "@/components/WETHAmountForm"

export function SafeWETHForm() {
    const {
        safeAddress,
        isSafeDeployed,
        isLoading,
        initiateSafeTransaction,
        initSafe,
        getSafeExplorerLink,
        ethBalance
    } = useSafe()

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

        // TODO: Refetch queries here or inside the initiateSafeTransaction hook
    }

    if (!safeAddress) {
        return <SafeInitForm isLoading={isLoading} initSafe={initSafe} />
    }

    return (
        <div className="space-y-4 pt-4">
            {!isSafeDeployed ? (
                <Alert variant="default">
                    <AlertDescription>
                        Your Safe account is not deployed yet. It will be deployed with your first transaction.
                    </AlertDescription>
                </Alert>
            ) : <SafeDetails
                ethBalance={ethBalance ?? 0n}
                safeAddress={safeAddress}
                isSafeDeployed={isSafeDeployed}
                getSafeExplorerLink={getSafeExplorerLink} />}
            <WETHAmountForm
                isLoading={isLoading}
                onWrap={handleWrap}
                onUnwrap={handleUnwrap}
            />
        </div>
    )
} 