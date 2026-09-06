import "dotenv/config";

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function list(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  /** Browser origins allowed to call the upload endpoint. Empty means same-origin only. */
  corsOrigins: list("CORS_ORIGINS"),
  pinata: {
    jwt: required("PINATA_JWT"),
    gateway: process.env.PINATA_GATEWAY ?? "gateway.pinata.cloud",
  },
  chain: {
    rpcUrl: process.env.CELO_RPC_URL ?? "https://forno.celo-sepolia.celo-testnet.org",
    registry: required("CONTRACT_ADDRESS") as `0x${string}`,
  },
  upload: {
    maxFileBytes: Number(process.env.MAX_FILE_MB ?? 25) * 1024 * 1024,
    /** Signed upload requests older than this are rejected as replays. */
    signatureTtlSeconds: Number(process.env.SIGNATURE_TTL_SECONDS ?? 300),
  },
};
