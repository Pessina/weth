import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    SafeMultisigTransactionListResponse,
} from "@safe-global/api-kit";
import { Safe4337CreateTransactionProps } from "@safe-global/relay-kit";

type SafeMultisigTransactionProps = {
    pendingTransactions?: SafeMultisigTransactionListResponse;
    signSafeProposal: (safeTxHash: string) => Promise<void>;
    createSafeProposal: (transactions: Safe4337CreateTransactionProps["transactions"]) => Promise<void>;
    executeSafeProposal: (safeTxHash: string) => Promise<void>;
};

export const SafePendingTransactions: React.FC<SafeMultisigTransactionProps> = ({
    pendingTransactions,
    signSafeProposal,
    executeSafeProposal
}) => {

    if (!pendingTransactions?.results?.length) {
        return (
            <Card className="p-4">
                <p className="text-sm text-muted-foreground">No pending transactions</p>
            </Card>
        );
    }

    const handleSign = async (transaction: SafeMultisigTransactionListResponse["results"][0]) => {
        try {
            await signSafeProposal(transaction.safeTxHash);
        } catch (error) {
            console.error("Failed to sign transaction:", error);
        }
    };

    const handleExecute = async (transaction: SafeMultisigTransactionListResponse["results"][0]) => {
        try {
            await executeSafeProposal(transaction.safeTxHash);
        } catch (error) {
            console.error("Failed to execute transaction:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Pending Transactions</h2>
                <p className="text-sm text-muted-foreground">
                    {pendingTransactions.results.length} transaction{pendingTransactions.results.length !== 1 ? 's' : ''} pending
                </p>
            </div>

            <div className="grid gap-4">
                {pendingTransactions.results.map((tx) => {
                    const hasEnoughConfirmations = (tx.confirmations?.length ?? 0) >= tx.confirmationsRequired;

                    return (
                        <Card key={tx.safeTxHash} className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium">Transaction Details</h3>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <span className="text-muted-foreground">To:</span>
                                            <code className="rounded bg-muted px-2 py-1">{tx.to}</code>
                                        </div>
                                        <p className="text-sm">
                                            <span className="text-muted-foreground">Value:</span>{" "}
                                            <span className="font-medium">{tx.value} ETH</span>
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end space-y-2">
                                        <div className="text-sm text-muted-foreground text-right">
                                            Confirmations: {tx.confirmations?.length ?? 0}/{tx.confirmationsRequired}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSign(tx)}
                                        disabled={hasEnoughConfirmations}
                                        className="w-36"
                                    >
                                        {hasEnoughConfirmations ? 'Fully Signed' : 'Sign Transaction'}
                                    </Button>
                                    {hasEnoughConfirmations && (
                                        <Button
                                            variant="default"
                                            onClick={() => handleExecute(tx)}
                                            className="w-36"
                                        >
                                            Execute
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
