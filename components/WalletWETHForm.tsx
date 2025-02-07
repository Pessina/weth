import { useWETHContract } from "@/contracts/weth/useWETHContract"
import { WETHAmountForm } from "@/components/WETHAmountForm"

export function WalletWETHForm() {
    const { deposit, withdraw, isWriting } = useWETHContract()

    return (
        <div className="space-y-4 pt-4">
            <WETHAmountForm
                isLoading={isWriting}
                onWrap={deposit}
                onUnwrap={withdraw}
            />
        </div>
    )
} 