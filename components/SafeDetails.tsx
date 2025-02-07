import Link from "next/link";
import { splitAddress } from "@/lib/utils";

type SafeDetailsProps = {
    safeAddress: string;
    isSafeDeployed: boolean;
    getSafeExplorerLink: (address: string) => string;
}

export const SafeDetails: React.FC<SafeDetailsProps> = ({ safeAddress, isSafeDeployed, getSafeExplorerLink }) => {

    if (!safeAddress) return null;

    return (
        <div className="text-sm">
            Safe Account:{" "}
            <Link
                href={getSafeExplorerLink(safeAddress)}
                target="_blank"
                className="text-blue-500 hover:underline"
            >
                {splitAddress(safeAddress)}
            </Link>
            {!isSafeDeployed && " (not deployed)"}
        </div>
    );
} 