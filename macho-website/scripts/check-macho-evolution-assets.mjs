import { inflateSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ASSET_DIRECTORY = path.resolve("public/picture/macho-evolution");
const EXPECTED_WIDTH = 720;
const EXPECTED_HEIGHT = 1080;
const MIN_ASSET_COUNT = 4;
const MIN_SUBJECT_COVERAGE = 0.18;
const MAX_SUBJECT_COVERAGE = 0.72;
const MAX_OPAQUE_EDGE_RATIO = 0.02;
const PNG_SIGNATURE = "89504e470d0a1a0a";

const collectPngFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectPngFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".png") ? [entryPath] : [];
    })
  );
  return nested.flat();
};

const paeth = (left, above, upperLeft) => {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
};

const parsePng = (buffer, filename) => {
  if (buffer.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) throw new Error(`${filename}: PNGではありません。`);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let transparency = Buffer.alloc(0);
  const compressedChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "tRNS") transparency = data;
    else if (type === "IDAT") compressedChunks.push(data);
    else if (type === "IEND") break;
  }

  if (bitDepth !== 8) throw new Error(`${filename}: 8-bit PNGのみ検査できます。現在は${bitDepth}-bitです。`);
  const bytesPerPixel = colorType === 6 ? 4 : colorType === 4 ? 2 : colorType === 3 ? 1 : 0;
  if (bytesPerPixel === 0 || (colorType === 3 && transparency.length === 0)) {
    throw new Error(`${filename}: alphaチャンネルまたはtRNS透過情報がありません。`);
  }

  const scanlineLength = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(compressedChunks));
  const rows = [];
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const source = inflated.subarray(sourceOffset, sourceOffset + scanlineLength);
    sourceOffset += scanlineLength;
    const row = Buffer.alloc(scanlineLength);
    const previous = rows[y - 1];

    for (let index = 0; index < scanlineLength; index += 1) {
      const raw = source[index];
      const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
      const above = previous?.[index] ?? 0;
      const upperLeft = index >= bytesPerPixel ? previous?.[index - bytesPerPixel] ?? 0 : 0;
      if (filter === 0) row[index] = raw;
      else if (filter === 1) row[index] = (raw + left) & 0xff;
      else if (filter === 2) row[index] = (raw + above) & 0xff;
      else if (filter === 3) row[index] = (raw + Math.floor((left + above) / 2)) & 0xff;
      else if (filter === 4) row[index] = (raw + paeth(left, above, upperLeft)) & 0xff;
      else throw new Error(`${filename}: 未対応のPNGフィルター${filter}です。`);
    }
    rows.push(row);
  }

  const alphaAt = (x, y) => {
    const row = rows[y];
    if (colorType === 6) return row[x * 4 + 3];
    if (colorType === 4) return row[x * 2 + 1];
    return transparency[row[x]] ?? 255;
  };

  let subjectPixels = 0;
  let opaqueEdgePixels = 0;
  let edgePixels = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = alphaAt(x, y);
      if (alpha > 8) subjectPixels += 1;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        edgePixels += 1;
        if (alpha > 8) opaqueEdgePixels += 1;
      }
    }
  }

  return {
    width,
    height,
    coverage: subjectPixels / (width * height),
    opaqueEdgeRatio: opaqueEdgePixels / edgePixels,
    cornersTransparent: [alphaAt(0, 0), alphaAt(width - 1, 0), alphaAt(0, height - 1), alphaAt(width - 1, height - 1)].every(
      (alpha) => alpha <= 8
    ),
  };
};

const assetPaths = (await collectPngFiles(ASSET_DIRECTORY)).sort();
if (assetPaths.length < MIN_ASSET_COUNT) throw new Error(`進化画像は最低${MIN_ASSET_COUNT}枚必要です。現在${assetPaths.length}枚です。`);

const results = [];
for (const assetPath of assetPaths) {
  const filename = path.relative(ASSET_DIRECTORY, assetPath);
  const metrics = parsePng(await readFile(assetPath), filename);
  if (metrics.width !== EXPECTED_WIDTH || metrics.height !== EXPECTED_HEIGHT) {
    throw new Error(`${filename}: ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}pxではありません（${metrics.width}x${metrics.height}px）。`);
  }
  if (!metrics.cornersTransparent) throw new Error(`${filename}: 四隅が透明ではありません。`);
  if (metrics.coverage < MIN_SUBJECT_COVERAGE || metrics.coverage > MAX_SUBJECT_COVERAGE) {
    throw new Error(`${filename}: 被写体占有率${(metrics.coverage * 100).toFixed(1)}%が許容範囲外です。`);
  }
  if (metrics.opaqueEdgeRatio > MAX_OPAQUE_EDGE_RATIO) {
    throw new Error(`${filename}: 外周の不透明画素が多すぎます（${(metrics.opaqueEdgeRatio * 100).toFixed(2)}%）。`);
  }
  results.push({ filename, coverage: `${(metrics.coverage * 100).toFixed(1)}%`, edge: `${(metrics.opaqueEdgeRatio * 100).toFixed(2)}%` });
}

console.table(results);
console.log(`Verified ${results.length} transparent Machoda evolution assets.`);
