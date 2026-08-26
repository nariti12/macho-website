import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const directory = path.resolve("public/images/characters/macho-face2/v1");
const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
assert.equal(manifest.version, "1.0.0");
assert.deepEqual(manifest.stages.map(({ level }) => level), [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
let totalBytes = 0;
for (const stage of manifest.stages) {
  const filename = path.basename(stage.deliveryWebp);
  const buffer = await readFile(path.join(directory, filename));
  assert.equal(createHash("sha256").update(buffer).digest("hex"), stage.deliverySha256, `${filename}: original hash`);
  const metadata = await sharp(buffer).metadata();
  assert.equal(metadata.width, 768, `${filename}: width`);
  assert.equal(metadata.height, 1230, `${filename}: height`);
  assert.equal(metadata.hasAlpha, true, `${filename}: transparency`);
  totalBytes += buffer.length;
  console.log(`${filename}: original bytes, 768×1230, alpha, ${buffer.length} bytes`);
}
console.log(`Verified all ${manifest.stages.length} approved WebPs (${totalBytes} bytes total).`);
