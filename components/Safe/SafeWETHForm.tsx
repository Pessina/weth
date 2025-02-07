import { useSafe } from "@/hooks/useSafe"
import { encodeFunctionData } from "viem"
import { wethABI } from "@/contracts/weth/wethABI"
import { contractAddresses } from "@/constants/addresses"
import { SafeInitForm } from "./SafeInitForm"
import { SafeDetails } from "./SafeDetails"
import { WETHAmountForm } from "@/components/WETHAmountForm"
import { useSafeStore } from "@/stores/useSafeStore"
import { useQuery } from "@tanstack/react-query"

export function SafeWETHForm() {
    const {
        safeAddress,
        isSafeDeployed,
        isLoading,
        initiateSafeTransaction,
        initSafe,
        getSafeExplorerLink,
        ethBalance,
        getTxConfirmations,
        resetSafe
    } = useSafe()
    const { onGoingSafeOperationHash, setOnGoingSafeOperationHash } = useSafeStore();

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

    // const { data: txConfirmations } = useQuery({
    //     queryKey: ["txConfirmations", onGoingSafeOperationHash],
    //     queryFn: () => {
    //         if (!onGoingSafeOperationHash) return 0;

    //         return getTxConfirmations({ safeTxHash: onGoingSafeOperationHash })
    //     },
    //     enabled: !!onGoingSafeOperationHash,
    //     refetchInterval: 1000,
    // });

    // console.log(txConfirmations);

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
            <WETHAmountForm
                isLoading={isLoading}
                onWrap={handleWrap}
                onUnwrap={handleUnwrap}
            />
        </div>
    )
} 