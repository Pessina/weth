import { useSafe } from "@/hooks/useSafe"
import { encodeFunctionData, Hex } from "viem"
import { wethABI } from "@/contracts/weth/wethABI"
import { contractAddresses } from "@/constants/addresses"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SafeInitForm } from "@/components/SafeInitForm"
import { WETHAmountForm } from "@/components/WETHAmountForm"
import { SafeDetails } from "./SafeDetails"

export function SafeWETHForm() {
    const {
        safeAddress,
        isSafeDeployed,
        isLoading,
        initiateSafeTransaction,
        initSafe,
        getSafeExplorerLink
    } = useSafe()

    async function handleWrap(amount: bigint): Promise<Hex> {
        const depositData = encodeFunctionData({
            abi: wethABI,
            functionName: 'deposit'
        });

        return await initiateSafeTransaction({
            transactions: [{
                to: contractAddresses.weth.sepolia,
                data: depositData,
                value: amount.toString()
            }]
        });
    }

    async function handleUnwrap(amount: bigint): Promise<Hex> {
        const withdrawData = encodeFunctionData({
            abi: wethABI,
            functionName: 'withdraw',
            args: [amount]
        });

        return await initiateSafeTransaction({
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

    return (
        <div className="space-y-4 pt-4">
            {!isSafeDeployed ? (
                <Alert variant="default">
                    <AlertDescription>
                        Your Safe account is not deployed yet. It will be deployed with your first transaction.
                    </AlertDescription>
                </Alert>
            ) : <SafeDetails safeAddress={safeAddress} isSafeDeployed={isSafeDeployed} getSafeExplorerLink={getSafeExplorerLink} />}
            <WETHAmountForm
                isLoading={isLoading}
                onWrap={handleWrap}
                onUnwrap={handleUnwrap}
            />
        </div>
    )
} 