import Link from "next/link";
import { splitAddress } from "@/lib/utils";
import { useWETHContract } from "@/contracts/weth/useWETHContract";
import { Balance } from "@/components/Balance";
import { useCallback } from "react";
import { Button } from "../ui/button";

type SafeDetailsProps = {
    ethBalance: bigint;
    safeAddress: string;
    isSafeDeployed: boolean;
    getSafeExplorerLink: (address: string) => string;
    disconnect: () => void;
}

export const SafeDetails: React.FC<SafeDetailsProps> = ({ ethBalance, safeAddress, isSafeDeployed, getSafeExplorerLink, disconnect }) => {
    const refreshQueries = useCallback(async () => {
        // TODO
    }, []);

    const { wethBalance, isWETHBalanceLoading } = useWETHContract({
        address: safeAddress,
        refreshQueries
    });

    return (
        <div className="rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                    <h3 className="font-medium">Safe Account</h3>
                    <div className="flex items-center gap-2">
                        <Link
                            href={getSafeExplorerLink(safeAddress)}
                            target="_blank"
                            className="text-blue-500 hover:underline text-sm"
                        >
                            {splitAddress(safeAddress)}
                        </Link>
                        {!isSafeDeployed && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Not Deployed
                            </span>
                        )}
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnect}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                    Disconnect
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-md">
                    {/* TODO: update this to use the isLoading prop */}
                    <Balance isLoading={false} balance={ethBalance} label="ETH" />
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                    <Balance isLoading={isWETHBalanceLoading} balance={wethBalance ?? 0n} label="WETH" />
                </div>
            </div>
        </div>
    );
}