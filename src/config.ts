import "dotenv/config";

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  pinata: {
    jwt: required("PINATA_JWT"),
    gateway: process.env.PINATA_GATEWAY ?? "gateway.pinata.cloud",
  },
};
