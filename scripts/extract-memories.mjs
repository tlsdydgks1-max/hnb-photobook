import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, parse } from "node:path";

const photoDir = process.argv[2] ?? "public/photos";
const output = process.argv[3] ?? "app/memories.json";
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic"]);

function readExif(filePath) {
  try {
    const result = execFileSync(
      "exiftool",
      ["-json", "-DateTimeOriginal", "-GPSLatitude", "-GPSLongitude", filePath],
      { encoding: "utf8" },
    );
    return JSON.parse(result)[0] ?? {};
  } catch {
    return {};
  }
}

function normalizeExifDate(value) {
  if (!value) return "";
  const [date] = String(value).split(" ");
  return date.replaceAll(":", ".");
}

function labelFromFileName(fileName) {
  return parse(fileName)
    .name.replace(/^\d{4}[-_.]\d{2}[-_.]\d{2}[-_\s]*/, "")
    .replaceAll(/[-_]+/g, " ")
    .trim();
}

if (!existsSync(photoDir)) {
  console.error(`Photo folder not found: ${photoDir}`);
  process.exit(1);
}

const memories = readdirSync(photoDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && imageExtensions.has(extname(entry.name).toLowerCase()))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((entry, index) => {
    const filePath = join(photoDir, entry.name);
    const exif = readExif(filePath);
    const inferredPlace = labelFromFileName(entry.name) || `추억 ${index + 1}`;

    return {
      id: `memory-${String(index + 1).padStart(2, "0")}`,
      image: `/photos/${entry.name}`,
      date: normalizeExifDate(exif.DateTimeOriginal) || "날짜를 입력해주세요",
      place: inferredPlace,
      title: "기억하고 싶은 순간",
      message: "여기에 사진에 담긴 마음을 한두 줄로 적어주세요.",
      exif: {
        takenAt: exif.DateTimeOriginal ?? undefined,
        latitude: exif.GPSLatitude ?? undefined,
        longitude: exif.GPSLongitude ?? undefined,
      },
    };
  });

writeFileSync(output, `${JSON.stringify(memories, null, 2)}\n`, "utf8");
console.log(`Wrote ${memories.length} memories to ${output}`);
