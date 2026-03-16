import { BatchTransferForm } from "@/components/BatchTransferForm";

export default function Home() {
  return (
    <div className="space-y-12 mt-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Batch Token <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Distributor</span>
        </h2>
        <p className="text-zinc-400 text-lg">
          Seamlessly airdrop or multisend native tokens and ERC20s across the Base network in a single, gas-optimized transaction.
        </p>
      </div>

      <BatchTransferForm />
    </div>
  );
}
