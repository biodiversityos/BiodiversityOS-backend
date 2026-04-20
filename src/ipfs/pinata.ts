import { uploadFile as pinataUpload } from "pinata";
import { config } from "../config.js";

const pinataConfig = { pinataJwt: config.pinata.jwt };

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
): Promise<{ cid: string; url: string }> {
  const blob = new Blob([fileBuffer as unknown as Uint8Array<ArrayBuffer>]);
  const file = new File([blob], fileName);
  const result = await pinataUpload(pinataConfig, file, "public");
  return {
    cid: result.cid,
    url: `https://${config.pinata.gateway}/ipfs/${result.cid}`,
  };
}
