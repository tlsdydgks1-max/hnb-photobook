import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, parse } from "node:path";

const photoDir = process.argv[2] ?? "public/photos";
const output = process.argv[3] ?? "src/photo-metadata.json";
const imageExtensions = new Set([".jpg", ".jpeg"]);

const TYPE_SIZES = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  7: 1,
  9: 4,
  10: 8,
};

function findExifSegment(buffer) {
  let offset = 2;

  while (offset < buffer.length - 4) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (marker === 0xe1) {
      const segment = buffer.subarray(offset + 4, offset + 2 + length);
      if (segment.subarray(0, 6).toString("ascii") === "Exif\0\0") {
        return segment.subarray(6);
      }
    }

    offset += 2 + length;
  }

  return null;
}

function createTiffReader(tiff) {
  const littleEndian = tiff.subarray(0, 2).toString("ascii") === "II";
  const readUInt16 = (offset) =>
    littleEndian ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset);
  const readUInt32 = (offset) =>
    littleEndian ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset);
  const readInt32 = (offset) =>
    littleEndian ? tiff.readInt32LE(offset) : tiff.readInt32BE(offset);

  return { readUInt16, readUInt32, readInt32 };
}

function readValue(tiff, reader, entryOffset) {
  const type = reader.readUInt16(entryOffset + 2);
  const count = reader.readUInt32(entryOffset + 4);
  const size = (TYPE_SIZES[type] ?? 1) * count;
  const valueOffset = size <= 4 ? entryOffset + 8 : reader.readUInt32(entryOffset + 8);

  if (type === 2) {
    return tiff
      .subarray(valueOffset, valueOffset + count)
      .toString("utf8")
      .replace(/\0+$/, "");
  }

  if (type === 3) {
    return Array.from({ length: count }, (_, index) =>
      reader.readUInt16(valueOffset + index * 2),
    );
  }

  if (type === 4) {
    return Array.from({ length: count }, (_, index) =>
      reader.readUInt32(valueOffset + index * 4),
    );
  }

  if (type === 5) {
    return Array.from({ length: count }, (_, index) => {
      const current = valueOffset + index * 8;
      const numerator = reader.readUInt32(current);
      const denominator = reader.readUInt32(current + 4);
      return denominator === 0 ? 0 : numerator / denominator;
    });
  }

  if (type === 9) {
    return Array.from({ length: count }, (_, index) =>
      reader.readInt32(valueOffset + index * 4),
    );
  }

  return null;
}

function readIfd(tiff, reader, offset) {
  if (!offset || offset + 2 > tiff.length) return new Map();

  const entries = new Map();
  const count = reader.readUInt16(offset);

  for (let index = 0; index < count; index += 1) {
    const entryOffset = offset + 2 + index * 12;
    if (entryOffset + 12 > tiff.length) break;
    entries.set(reader.readUInt16(entryOffset), readValue(tiff, reader, entryOffset));
  }

  return entries;
}

function toDecimal(values, ref) {
  if (!Array.isArray(values) || values.length < 3) return undefined;
  const decimal = values[0] + values[1] / 60 + values[2] / 3600;
  return ref === "S" || ref === "W" ? -decimal : decimal;
}

function parseExif(filePath) {
  const buffer = readFileSync(filePath);
  const tiff = findExifSegment(buffer);
  if (!tiff) return {};

  const reader = createTiffReader(tiff);
  const firstIfdOffset = reader.readUInt32(4);
  const ifd = readIfd(tiff, reader, firstIfdOffset);
  const exifIfd = readIfd(tiff, reader, ifd.get(0x8769)?.[0]);
  const gpsIfd = readIfd(tiff, reader, ifd.get(0x8825)?.[0]);

  const latitude = toDecimal(gpsIfd.get(0x0002), gpsIfd.get(0x0001));
  const longitude = toDecimal(gpsIfd.get(0x0004), gpsIfd.get(0x0003));

  return {
    takenAt: exifIfd.get(0x9003) || exifIfd.get(0x9004) || undefined,
    latitude,
    longitude,
  };
}

function displayName(fileName) {
  return parse(fileName).name;
}

const metadata = readdirSync(photoDir, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isFile() && imageExtensions.has(extname(entry.name).toLowerCase()),
  )
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  .map((entry) => {
    const exif = parseExif(join(photoDir, entry.name));

    return {
      id: displayName(entry.name),
      file: `/photos/${entry.name}`,
      exif,
    };
  });

writeFileSync(output, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
console.log(`Wrote ${metadata.length} photo metadata records to ${output}`);
