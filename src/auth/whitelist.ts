import { createPublicClient, http, verifyMessage, isAddress } from "viem";
import { celoSepolia } from "viem/chains";
import { config } from "../config.js";

const REGISTRY_ABI = [
  {
    type: "function",
    name: "whitelist",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const client = createPublicClient({
  chain: celoSepolia,
  transport: http(config.chain.rpcUrl),
});

/** The exact string a reporter signs to prove control of their address. */
export function uploadChallenge(address: string, issuedAt: number): string {
  return `BiodiversityOS upload\naddress: ${address.toLowerCase()}\nissuedAt: ${issuedAt}`;
}

export type AuthFailure = { ok: false; reason: string };
export type AuthSuccess = { ok: true; address: `0x${string}` };

/**
 * Uploads are gated on the same whitelist the registry enforces, so the IPFS
 * endpoint cannot be used as free pinning by anyone who finds the URL.
 */
export async function authorizeUpload(
  address: string | undefined,
  issuedAt: string | undefined,
  signature: string | undefined,
): Promise<AuthSuccess | AuthFailure> {
  if (!address || !issuedAt || !signature) {
    return { ok: false, reason: "Missing x-address, x-issued-at or x-signature header" };
  }
  if (!isAddress(address)) {
    return { ok: false, reason: "Malformed address" };
  }

  const issued = Number(issuedAt);
  if (!Number.isFinite(issued)) {
    return { ok: false, reason: "Malformed issuedAt" };
  }
  const ageSeconds = Math.abs(Date.now() / 1000 - issued);
  if (ageSeconds > config.upload.signatureTtlSeconds) {
    return { ok: false, reason: "Signature expired" };
  }

  let validSignature = false;
  try {
    validSignature = await verifyMessage({
      address: address as `0x${string}`,
      message: uploadChallenge(address, issued),
      signature: signature as `0x${string}`,
    });
  } catch {
    return { ok: false, reason: "Malformed signature" };
  }
  if (!validSignature) {
    return { ok: false, reason: "Signature does not match address" };
  }

  let whitelisted: boolean;
  try {
    whitelisted = await client.readContract({
      address: config.chain.registry,
      abi: REGISTRY_ABI,
      functionName: "whitelist",
      args: [address as `0x${string}`],
    });
  } catch {
    // Fail closed: an RPC outage must not turn the endpoint into an open relay.
    return { ok: false, reason: "Could not verify whitelist status, try again" };
  }
  if (!whitelisted) {
    return { ok: false, reason: "Address is not an accredited reporter" };
  }

  return { ok: true, address: address as `0x${string}` };
}
