#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import sharp from 'sharp';

const defaultTaskDir = '.agents/tasks/creating-ck3-mini-gameplay';
const defaultCharacterSource = 'all-characters-lineup.png';
const defaultCharacterMask = 'all-characters-green-screen.png';
const defaultAssetSource = 'all-characters-with-assets.png';
const defaultCharacterLabels = [
  'lauretana-da-grosseto',
  'giommaria-il-locandiere',
  'alessandro-di-monza',
  'donna-roberta-di-modena',
  'phabous-koleman',
  'regina-georgia',
];

const commandHelp = `
CK3 asset tools

Usage:
  node scripts/ck3-asset-tools.mjs inspect [--task-dir <dir>] [--out <file>]
  node scripts/ck3-asset-tools.mjs detect-characters [options]
  node scripts/ck3-asset-tools.mjs detect-assets [options]
  node scripts/ck3-asset-tools.mjs crop --manifest <file> [options]

Useful examples:
  yarn ck3:assets inspect
  yarn ck3:assets detect-characters
  yarn ck3:assets detect-assets --region 820,0,588,768 --limit 24
  yarn ck3:assets crop --manifest .agents/tasks/creating-ck3-mini-gameplay/generated-assets/asset-candidates.manifest.json

Shared options:
  --task-dir <dir>        Task folder. Default: ${defaultTaskDir}
  --out-dir <dir>        Output folder. Default: <task-dir>/generated-assets
  --manifest <file>      Manifest path to write/read.
  --html <file>          HTML image-map/debug overlay path to write.
  --crop                 Also write crop PNGs for detected regions.
  --padding <px>         Expand detected boxes. Default depends on command.
  --limit <count>        Keep the largest N components before sorting left-to-right.

Character detection defaults:
  --source <file>        Visible coordinate source. Default: ${defaultCharacterSource}
  --mask <file>          Green-screen mask source. Default: ${defaultCharacterMask}
  --labels <csv>         Labels for left-to-right regions.

Asset detection defaults:
  --source <file>        Crop source. Default: ${defaultAssetSource}
  --region x,y,w,h       Restrict detection to a region. Repeatable.
  --ignore-region x,y,w,h Ignore a region. Repeatable.
`;

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const parsedArgs = parseArgs(process.argv.slice(2));
  const command = parsedArgs.positionals[0] ?? 'help';

  if (command === 'help' || hasFlag(parsedArgs.flags, 'help')) {
    console.log(commandHelp.trim());
    return;
  }

  if (command === 'inspect') {
    await inspectSheets(parsedArgs.flags);
    return;
  }

  if (command === 'detect-characters') {
    await detectCharacters(parsedArgs.flags);
    return;
  }

  if (command === 'detect-assets') {
    await detectAssets(parsedArgs.flags);
    return;
  }

  if (command === 'crop') {
    await cropFromManifest(parsedArgs.flags);
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${commandHelp.trim()}`);
}

async function inspectSheets(flags) {
  const taskDir = resolveWorkspacePath(getFlag(flags, 'task-dir', defaultTaskDir));
  const outputPath = getOptionalOutputPath(flags, taskDir, 'out');
  const taskFiles = await readdir(taskDir, { withFileTypes: true });
  const pngFiles = taskFiles
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
    .map((entry) => path.join(taskDir, entry.name))
    .sort((firstPath, secondPath) => firstPath.localeCompare(secondPath));

  const sheets = [];
  for (const imagePath of pngFiles) {
    const metadata = await sharp(imagePath).metadata();
    const image = await loadRawImage(imagePath);
    const edgeColor = sampleMedianEdgeColor(image, 12);
    const transparentSamples = countTransparentSamples(image, 32);

    sheets.push({
      file: toWorkspacePath(imagePath),
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      edgeColor,
      transparentSamples,
    });
  }

  const report = {
    taskDir: toWorkspacePath(taskDir),
    preferredSources: {
      characters: toWorkspacePath(path.join(taskDir, defaultCharacterSource)),
      assets: toWorkspacePath(path.join(taskDir, defaultAssetSource)),
      characterMask: toWorkspacePath(path.join(taskDir, defaultCharacterMask)),
    },
    sheets,
  };

  if (outputPath) {
    await writeJson(outputPath, report);
    console.log(`Wrote ${toWorkspacePath(outputPath)}`);
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

async function detectCharacters(flags) {
  const taskDir = resolveWorkspacePath(getFlag(flags, 'task-dir', defaultTaskDir));
  const sourcePath = resolveTaskInputPath(taskDir, getFlag(flags, 'source', defaultCharacterSource));
  const maskPath = resolveTaskInputPath(taskDir, getFlag(flags, 'mask', defaultCharacterMask));
  const outputDir = resolveOutputDir(taskDir, flags);
  const cropDir = path.join(outputDir, 'characters');
  const manifestPath = resolveOutputPath(
    taskDir,
    flags,
    'manifest',
    path.join(outputDir, 'characters.manifest.json'),
  );
  const htmlPath = resolveOutputPath(
    taskDir,
    flags,
    'html',
    path.join(outputDir, 'characters-map.html'),
  );

  const sourceImage = await loadRawImage(sourcePath);
  const maskImage = await loadRawImage(maskPath);
  assertSameDimensions(sourceImage, maskImage, sourcePath, maskPath);

  const foregroundMask = createGreenScreenForegroundMask(maskImage, {
    greenMin: getNumberFlag(flags, 'green-min', 90),
    greenDelta: getNumberFlag(flags, 'green-delta', 35),
  });
  const componentMask = dilateMask(
    foregroundMask,
    maskImage.width,
    maskImage.height,
    getNumberFlag(flags, 'dilate', 3),
  );
  const detectedBoxes = connectedComponents(componentMask, maskImage.width, maskImage.height, {
    minArea: getNumberFlag(flags, 'min-area', 5_000),
    minWidth: getNumberFlag(flags, 'min-width', 50),
    minHeight: getNumberFlag(flags, 'min-height', 160),
    maxAreaRatio: getNumberFlag(flags, 'max-area-ratio', 0.35),
  });
  const mergedBoxes = mergeNearbyBoxes(detectedBoxes, getNumberFlag(flags, 'merge-distance', 22));
  const characterLimit = getNumberFlag(flags, 'limit', 6);
  const candidateBoxes =
    !hasFlag(flags, 'no-split') && characterLimit > 1 && mergedBoxes.length < characterLimit
      ? splitForegroundGroupByColumns(foregroundMask, maskImage.width, maskImage.height, mergedBoxes, characterLimit)
      : mergedBoxes;
  const limitedBoxes = limitLargestBoxes(candidateBoxes, characterLimit);
  const paddedBoxes = limitedBoxes
    .map((box) => padBox(box, getNumberFlag(flags, 'padding', 12), sourceImage.width, sourceImage.height))
    .sort(compareBoxesLeftToRight);
  const labels = parseLabels(getFlag(flags, 'labels', defaultCharacterLabels.join(',')));
  const regions = paddedBoxes.map((box, index) => makeRegion({
    box,
    index,
    imageWidth: sourceImage.width,
    imageHeight: sourceImage.height,
    label: labels[index] ?? `character-${String(index + 1).padStart(2, '0')}`,
    type: 'character',
  }));

  if (hasFlag(flags, 'crop')) {
    await mkdir(cropDir, { recursive: true });
    for (const region of regions) {
      const fileName = `${region.id}.png`;
      const cropPath = path.join(cropDir, fileName);
      await writeAlphaCrop(sourceImage, foregroundMask, region.bbox, cropPath);
      region.cropPath = toWorkspacePath(cropPath);
    }
  }

  const manifest = makeManifest({
    kind: 'characters',
    sourcePath,
    maskPath,
    imageWidth: sourceImage.width,
    imageHeight: sourceImage.height,
    regions,
    notes: [
      `${defaultCharacterSource} is used as the visible source for character crops.`,
      `${defaultCharacterSource} is the preferred character coordinate source.`,
      `${defaultCharacterMask} can be used as an optional mask, but final sprites are expected to be cut manually.`,
    ],
  });

  await writeJson(manifestPath, manifest);
  await writeImageMapHtml({
    title: 'CK3 character map',
    imagePath: sourcePath,
    imageWidth: sourceImage.width,
    imageHeight: sourceImage.height,
    htmlPath,
    mapName: 'ck3-character-map',
    regions,
  });

  console.log(`Detected ${regions.length} character regions.`);
  console.log(`Wrote ${toWorkspacePath(manifestPath)}`);
  console.log(`Wrote ${toWorkspacePath(htmlPath)}`);
}

async function detectAssets(flags) {
  const taskDir = resolveWorkspacePath(getFlag(flags, 'task-dir', defaultTaskDir));
  const sourcePath = resolveTaskInputPath(taskDir, getFlag(flags, 'source', defaultAssetSource));
  const outputDir = resolveOutputDir(taskDir, flags);
  const cropDir = path.join(outputDir, 'asset-candidates');
  const manifestPath = resolveOutputPath(
    taskDir,
    flags,
    'manifest',
    path.join(outputDir, 'asset-candidates.manifest.json'),
  );
  const htmlPath = resolveOutputPath(
    taskDir,
    flags,
    'html',
    path.join(outputDir, 'asset-candidates-map.html'),
  );

  const sourceImage = await loadRawImage(sourcePath);
  const allowedRegions = parseRegionFlags(flags, 'region', sourceImage.width, sourceImage.height);
  const ignoredRegions = parseRegionFlags(flags, 'ignore-region', sourceImage.width, sourceImage.height);
  const saliencyMask = createSaliencyMask(sourceImage, {
    backgroundTolerance: getNumberFlag(flags, 'background-tolerance', 70),
    saturationThreshold: getNumberFlag(flags, 'saturation-threshold', 0.16),
    lumaDelta: getNumberFlag(flags, 'luma-delta', 32),
    allowedRegions,
    ignoredRegions,
  });
  const componentMask = dilateMask(
    saliencyMask,
    sourceImage.width,
    sourceImage.height,
    getNumberFlag(flags, 'dilate', 2),
  );
  const detectedBoxes = connectedComponents(componentMask, sourceImage.width, sourceImage.height, {
    minArea: getNumberFlag(flags, 'min-area', 800),
    minWidth: getNumberFlag(flags, 'min-width', 16),
    minHeight: getNumberFlag(flags, 'min-height', 16),
    maxAreaRatio: getNumberFlag(flags, 'max-area-ratio', 0.28),
  });
  const mergedBoxes = mergeNearbyBoxes(detectedBoxes, getNumberFlag(flags, 'merge-distance', 8));
  const limitedBoxes = limitLargestBoxes(mergedBoxes, getNumberFlag(flags, 'limit', 30));
  const paddedBoxes = limitedBoxes
    .map((box) => padBox(box, getNumberFlag(flags, 'padding', 8), sourceImage.width, sourceImage.height))
    .sort(compareBoxesTopToBottom);
  const regions = paddedBoxes.map((box, index) => makeRegion({
    box,
    index,
    imageWidth: sourceImage.width,
    imageHeight: sourceImage.height,
    label: `asset-candidate-${String(index + 1).padStart(2, '0')}`,
    type: 'asset-candidate',
  }));

  if (hasFlag(flags, 'crop')) {
    await mkdir(cropDir, { recursive: true });
    for (const region of regions) {
      const cropPath = path.join(cropDir, `${region.id}.png`);
      await sharp(sourcePath)
        .extract({ left: region.bbox.x, top: region.bbox.y, width: region.bbox.width, height: region.bbox.height })
        .png()
        .toFile(cropPath);
      region.cropPath = toWorkspacePath(cropPath);
    }
  }

  const manifest = makeManifest({
    kind: 'asset-candidates',
    sourcePath,
    imageWidth: sourceImage.width,
    imageHeight: sourceImage.height,
    regions,
    notes: [
      `${defaultAssetSource} is used as the default source for prop and interface asset candidates.`,
      'This mode uses saliency detection, so inspect the HTML map and keep or refine the useful boxes.',
      'Use --region or --ignore-region to focus detection on a specific part of the sheet.',
    ],
  });

  await writeJson(manifestPath, manifest);
  await writeImageMapHtml({
    title: 'CK3 asset candidate map',
    imagePath: sourcePath,
    imageWidth: sourceImage.width,
    imageHeight: sourceImage.height,
    htmlPath,
    mapName: 'ck3-asset-map',
    regions,
  });

  console.log(`Detected ${regions.length} asset candidate regions.`);
  console.log(`Wrote ${toWorkspacePath(manifestPath)}`);
  console.log(`Wrote ${toWorkspacePath(htmlPath)}`);
}

async function cropFromManifest(flags) {
  const taskDir = resolveWorkspacePath(getFlag(flags, 'task-dir', defaultTaskDir));
  const manifestFlag = getFlag(flags, 'manifest', undefined);
  if (!manifestFlag) {
    throw new Error('crop requires --manifest <file>.');
  }

  const manifestPath = resolveTaskInputPath(taskDir, manifestFlag);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const sourcePath = resolveTaskInputPath(taskDir, getFlag(flags, 'source', manifest.source));
  const maskPath = manifest.mask ? resolveTaskInputPath(taskDir, getFlag(flags, 'mask', manifest.mask)) : undefined;
  const outputDir = resolveOutputDir(taskDir, flags);
  const cropDir = path.join(outputDir, getFlag(flags, 'folder', `${manifest.kind ?? 'manifest'}-crops`));

  await mkdir(cropDir, { recursive: true });

  const sourceImage = await loadRawImage(sourcePath);
  let foregroundMask;
  if (maskPath && hasFlag(flags, 'alpha-from-mask')) {
    const maskImage = await loadRawImage(maskPath);
    assertSameDimensions(sourceImage, maskImage, sourcePath, maskPath);
    foregroundMask = createGreenScreenForegroundMask(maskImage, {
      greenMin: getNumberFlag(flags, 'green-min', 90),
      greenDelta: getNumberFlag(flags, 'green-delta', 35),
    });
  }

  for (const region of manifest.regions ?? []) {
    const safeId = slugify(region.id ?? region.label ?? 'crop');
    const cropPath = path.join(cropDir, `${safeId}.png`);
    const box = normalizeBox(region.bbox, sourceImage.width, sourceImage.height);
    if (foregroundMask) {
      await writeAlphaCrop(sourceImage, foregroundMask, box, cropPath);
    } else {
      await sharp(sourcePath)
        .extract({ left: box.x, top: box.y, width: box.width, height: box.height })
        .png()
        .toFile(cropPath);
    }
  }

  console.log(`Cropped ${(manifest.regions ?? []).length} regions to ${toWorkspacePath(cropDir)}`);
}

function parseArgs(args) {
  const flags = new Map();
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split(/=(.*)/s, 2);
    const nextArg = args[index + 1];
    const hasInlineValue = inlineValue !== undefined && inlineValue !== '';
    const shouldConsumeNext = !hasInlineValue && nextArg !== undefined && !nextArg.startsWith('--');
    const value = hasInlineValue ? inlineValue : shouldConsumeNext ? nextArg : true;

    addFlag(flags, rawKey, value);
    if (shouldConsumeNext) {
      index += 1;
    }
  }

  return { flags, positionals };
}

function addFlag(flags, key, value) {
  const existing = flags.get(key);
  if (existing === undefined) {
    flags.set(key, value);
    return;
  }

  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }

  flags.set(key, [existing, value]);
}

function hasFlag(flags, key) {
  return flags.has(key) && flags.get(key) !== false;
}

function getFlag(flags, key, fallback) {
  const value = flags.get(key);
  if (value === undefined) {
    return fallback;
  }

  if (Array.isArray(value)) {
    return String(value.at(-1));
  }

  return String(value);
}

function getNumberFlag(flags, key, fallback) {
  const value = getFlag(flags, key, undefined);
  if (value === undefined) {
    return fallback;
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    throw new Error(`--${key} must be a number. Received: ${value}`);
  }

  return parsedValue;
}

function getRepeatedFlags(flags, key) {
  const value = flags.get(key);
  if (value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  return [String(value)];
}

function parseLabels(value) {
  return String(value)
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);
}

function resolveWorkspacePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
}

function resolveTaskInputPath(taskDir, inputPath) {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  if (inputPath.startsWith('.') || inputPath.includes('/') || inputPath.includes('\\')) {
    return path.resolve(process.cwd(), inputPath);
  }

  return path.join(taskDir, inputPath);
}

function resolveOutputDir(taskDir, flags) {
  const outputDir = getFlag(flags, 'out-dir', path.join(taskDir, 'generated-assets'));
  return path.isAbsolute(outputDir) ? outputDir : path.resolve(process.cwd(), outputDir);
}

function resolveOutputPath(taskDir, flags, key, fallbackPath) {
  const outputPath = getFlag(flags, key, fallbackPath);
  if (path.isAbsolute(outputPath)) {
    return outputPath;
  }

  if (outputPath.startsWith('.') || outputPath.includes('/') || outputPath.includes('\\')) {
    return path.resolve(process.cwd(), outputPath);
  }

  return path.join(taskDir, outputPath);
}

function getOptionalOutputPath(flags, taskDir, key) {
  const outputPath = getFlag(flags, key, undefined);
  if (!outputPath) {
    return undefined;
  }

  return resolveOutputPath(taskDir, flags, key, outputPath);
}

async function loadRawImage(imagePath) {
  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return {
    path: imagePath,
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
}

function assertSameDimensions(firstImage, secondImage, firstPath, secondPath) {
  if (firstImage.width !== secondImage.width || firstImage.height !== secondImage.height) {
    throw new Error(
      `Image dimensions differ: ${toWorkspacePath(firstPath)} is ${firstImage.width}x${firstImage.height}, ` +
        `${toWorkspacePath(secondPath)} is ${secondImage.width}x${secondImage.height}.`,
    );
  }
}

function createGreenScreenForegroundMask(image, options) {
  const mask = new Uint8Array(image.width * image.height);

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    const dataIndex = pixelIndex * image.channels;
    const red = image.data[dataIndex];
    const green = image.data[dataIndex + 1];
    const blue = image.data[dataIndex + 2];
    const alpha = image.data[dataIndex + 3];
    const isGreenBackground =
      alpha > 0 && green >= options.greenMin && green - red >= options.greenDelta && green - blue >= options.greenDelta;
    mask[pixelIndex] = isGreenBackground ? 0 : 1;
  }

  return mask;
}

function createSaliencyMask(image, options) {
  const edgeColor = sampleMedianEdgeColor(image, 10);
  const edgeLuma = luma(edgeColor.red, edgeColor.green, edgeColor.blue);
  const mask = new Uint8Array(image.width * image.height);

  for (let top = 0; top < image.height; top += 1) {
    for (let left = 0; left < image.width; left += 1) {
      const pixelIndex = top * image.width + left;
      if (!isInsideAnyRegion(left, top, options.allowedRegions) || isInsideAnyRegion(left, top, options.ignoredRegions)) {
        continue;
      }

      const dataIndex = pixelIndex * image.channels;
      const red = image.data[dataIndex];
      const green = image.data[dataIndex + 1];
      const blue = image.data[dataIndex + 2];
      const alpha = image.data[dataIndex + 3];

      if (alpha < 20) {
        continue;
      }

      const distance = colorDistance(red, green, blue, edgeColor.red, edgeColor.green, edgeColor.blue);
      const saturation = colorSaturation(red, green, blue);
      const pixelLuma = luma(red, green, blue);
      const lumaDistance = Math.abs(pixelLuma - edgeLuma);
      const isSalient =
        distance >= options.backgroundTolerance &&
        (saturation >= options.saturationThreshold || lumaDistance >= options.lumaDelta);

      mask[pixelIndex] = isSalient ? 1 : 0;
    }
  }

  return mask;
}

function dilateMask(mask, width, height, radius) {
  if (radius <= 0) {
    return mask;
  }

  const dilatedMask = new Uint8Array(mask.length);
  const integerRadius = Math.floor(radius);

  for (let top = 0; top < height; top += 1) {
    for (let left = 0; left < width; left += 1) {
      const pixelIndex = top * width + left;
      if (mask[pixelIndex] === 0) {
        continue;
      }

      const minTop = Math.max(0, top - integerRadius);
      const maxTop = Math.min(height - 1, top + integerRadius);
      const minLeft = Math.max(0, left - integerRadius);
      const maxLeft = Math.min(width - 1, left + integerRadius);

      for (let neighborTop = minTop; neighborTop <= maxTop; neighborTop += 1) {
        const rowOffset = neighborTop * width;
        for (let neighborLeft = minLeft; neighborLeft <= maxLeft; neighborLeft += 1) {
          dilatedMask[rowOffset + neighborLeft] = 1;
        }
      }
    }
  }

  return dilatedMask;
}

function connectedComponents(mask, width, height, options) {
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  const components = [];
  const maxArea = width * height * options.maxAreaRatio;

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (mask[pixelIndex] === 0 || visited[pixelIndex] === 1) {
      continue;
    }

    let queueStart = 0;
    let queueEnd = 0;
    let area = 0;
    let minLeft = width;
    let maxLeft = 0;
    let minTop = height;
    let maxTop = 0;

    queue[queueEnd] = pixelIndex;
    queueEnd += 1;
    visited[pixelIndex] = 1;

    while (queueStart < queueEnd) {
      const currentIndex = queue[queueStart];
      queueStart += 1;
      area += 1;

      const top = Math.floor(currentIndex / width);
      const left = currentIndex - top * width;
      minLeft = Math.min(minLeft, left);
      maxLeft = Math.max(maxLeft, left);
      minTop = Math.min(minTop, top);
      maxTop = Math.max(maxTop, top);

      const neighbors = [
        currentIndex - 1,
        currentIndex + 1,
        currentIndex - width,
        currentIndex + width,
      ];

      for (const neighborIndex of neighbors) {
        if (neighborIndex < 0 || neighborIndex >= mask.length) {
          continue;
        }

        const neighborTop = Math.floor(neighborIndex / width);
        const neighborLeft = neighborIndex - neighborTop * width;
        const crossesRow = Math.abs(neighborLeft - left) > 1 || Math.abs(neighborTop - top) > 1;
        if (crossesRow || mask[neighborIndex] === 0 || visited[neighborIndex] === 1) {
          continue;
        }

        visited[neighborIndex] = 1;
        queue[queueEnd] = neighborIndex;
        queueEnd += 1;
      }
    }

    const componentWidth = maxLeft - minLeft + 1;
    const componentHeight = maxTop - minTop + 1;
    if (
      area >= options.minArea &&
      area <= maxArea &&
      componentWidth >= options.minWidth &&
      componentHeight >= options.minHeight
    ) {
      components.push({ x: minLeft, y: minTop, width: componentWidth, height: componentHeight, area });
    }
  }

  return components;
}

function mergeNearbyBoxes(boxes, distance) {
  const mergedBoxes = boxes.map((box) => ({ ...box }));
  let changed = true;

  while (changed) {
    changed = false;

    for (let firstIndex = 0; firstIndex < mergedBoxes.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < mergedBoxes.length; secondIndex += 1) {
        if (!boxesTouchOrOverlap(mergedBoxes[firstIndex], mergedBoxes[secondIndex], distance)) {
          continue;
        }

        mergedBoxes[firstIndex] = unionBoxes(mergedBoxes[firstIndex], mergedBoxes[secondIndex]);
        mergedBoxes.splice(secondIndex, 1);
        changed = true;
        break;
      }

      if (changed) {
        break;
      }
    }
  }

  return mergedBoxes;
}

function splitForegroundGroupByColumns(foregroundMask, imageWidth, imageHeight, boxes, targetCount) {
  if (boxes.length === 0) {
    return [];
  }

  const groupBox = boxes.reduce((currentBox, nextBox) => unionBoxes(currentBox, nextBox));
  const columnCounts = [];
  for (let left = groupBox.x; left < groupBox.x + groupBox.width; left += 1) {
    let count = 0;
    for (let top = groupBox.y; top < groupBox.y + groupBox.height; top += 1) {
      count += foregroundMask[top * imageWidth + left];
    }
    columnCounts.push(count);
  }

  const smoothedCounts = smoothValues(columnCounts, Math.max(3, Math.floor(groupBox.width / 120)));
  const cutColumns = findProjectionCutColumns(smoothedCounts, groupBox.x, groupBox.width, targetCount);
  const segmentEdges = [groupBox.x, ...cutColumns, groupBox.x + groupBox.width];
  const splitBoxes = [];

  for (let segmentIndex = 0; segmentIndex < segmentEdges.length - 1; segmentIndex += 1) {
    const segmentLeft = segmentEdges[segmentIndex];
    const segmentRight = segmentEdges[segmentIndex + 1];
    const segmentBox = boundingBoxForForegroundSegment(
      foregroundMask,
      imageWidth,
      imageHeight,
      segmentLeft,
      segmentRight,
      groupBox.y,
      groupBox.y + groupBox.height,
    );

    if (segmentBox) {
      splitBoxes.push(segmentBox);
    }
  }

  return splitBoxes.length >= Math.min(targetCount, 2) ? splitBoxes : boxes;
}

function smoothValues(values, radius) {
  return values.map((_, index) => {
    const minIndex = Math.max(0, index - radius);
    const maxIndex = Math.min(values.length - 1, index + radius);
    let total = 0;
    for (let sampleIndex = minIndex; sampleIndex <= maxIndex; sampleIndex += 1) {
      total += values[sampleIndex];
    }

    return total / (maxIndex - minIndex + 1);
  });
}

function findProjectionCutColumns(smoothedCounts, groupLeft, groupWidth, targetCount) {
  const cutColumns = [];
  const approximateSegmentWidth = groupWidth / targetCount;
  const searchRadius = Math.max(16, Math.floor(approximateSegmentWidth * 0.36));
  const minSegmentWidth = Math.max(24, Math.floor(approximateSegmentWidth * 0.45));

  for (let cutIndex = 1; cutIndex < targetCount; cutIndex += 1) {
    const idealColumn = Math.round(approximateSegmentWidth * cutIndex);
    const minColumn = Math.max(
      minSegmentWidth,
      idealColumn - searchRadius,
      cutColumns.length > 0 ? cutColumns[cutColumns.length - 1] - groupLeft + minSegmentWidth : 0,
    );
    const maxColumn = Math.min(groupWidth - minSegmentWidth, idealColumn + searchRadius);
    let bestColumn = idealColumn;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let column = minColumn; column <= maxColumn; column += 1) {
      const score = smoothedCounts[column] ?? Number.POSITIVE_INFINITY;
      if (score < bestScore) {
        bestScore = score;
        bestColumn = column;
      }
    }

    cutColumns.push(groupLeft + bestColumn);
  }

  return cutColumns;
}

function boundingBoxForForegroundSegment(foregroundMask, imageWidth, imageHeight, segmentLeft, segmentRight, segmentTop, segmentBottom) {
  let minLeft = imageWidth;
  let maxLeft = 0;
  let minTop = imageHeight;
  let maxTop = 0;
  let area = 0;

  for (let top = segmentTop; top < segmentBottom; top += 1) {
    for (let left = segmentLeft; left < segmentRight; left += 1) {
      if (foregroundMask[top * imageWidth + left] === 0) {
        continue;
      }

      area += 1;
      minLeft = Math.min(minLeft, left);
      maxLeft = Math.max(maxLeft, left);
      minTop = Math.min(minTop, top);
      maxTop = Math.max(maxTop, top);
    }
  }

  if (area === 0) {
    return undefined;
  }

  return {
    x: minLeft,
    y: minTop,
    width: maxLeft - minLeft + 1,
    height: maxTop - minTop + 1,
    area,
  };
}

function boxesTouchOrOverlap(firstBox, secondBox, distance) {
  return !(
    firstBox.x + firstBox.width + distance < secondBox.x ||
    secondBox.x + secondBox.width + distance < firstBox.x ||
    firstBox.y + firstBox.height + distance < secondBox.y ||
    secondBox.y + secondBox.height + distance < firstBox.y
  );
}

function unionBoxes(firstBox, secondBox) {
  const minLeft = Math.min(firstBox.x, secondBox.x);
  const minTop = Math.min(firstBox.y, secondBox.y);
  const maxRight = Math.max(firstBox.x + firstBox.width, secondBox.x + secondBox.width);
  const maxBottom = Math.max(firstBox.y + firstBox.height, secondBox.y + secondBox.height);

  return {
    x: minLeft,
    y: minTop,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
    area: firstBox.area + secondBox.area,
  };
}

function limitLargestBoxes(boxes, limit) {
  if (limit <= 0 || boxes.length <= limit) {
    return boxes;
  }

  return [...boxes]
    .sort((firstBox, secondBox) => secondBox.area - firstBox.area)
    .slice(0, limit);
}

function padBox(box, padding, imageWidth, imageHeight) {
  const minLeft = Math.max(0, Math.floor(box.x - padding));
  const minTop = Math.max(0, Math.floor(box.y - padding));
  const maxRight = Math.min(imageWidth, Math.ceil(box.x + box.width + padding));
  const maxBottom = Math.min(imageHeight, Math.ceil(box.y + box.height + padding));

  return {
    x: minLeft,
    y: minTop,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
    area: box.area,
  };
}

function normalizeBox(box, imageWidth, imageHeight) {
  if (!box || !Number.isFinite(box.x) || !Number.isFinite(box.y)) {
    throw new Error('Manifest region is missing bbox.x or bbox.y.');
  }

  return padBox({ x: box.x, y: box.y, width: box.width, height: box.height, area: box.area ?? 0 }, 0, imageWidth, imageHeight);
}

function compareBoxesLeftToRight(firstBox, secondBox) {
  return firstBox.x - secondBox.x || firstBox.y - secondBox.y;
}

function compareBoxesTopToBottom(firstBox, secondBox) {
  return firstBox.y - secondBox.y || firstBox.x - secondBox.x;
}

function makeRegion({ box, index, imageWidth, imageHeight, label, type }) {
  const id = `${String(index + 1).padStart(2, '0')}-${slugify(label)}`;
  const right = box.x + box.width;
  const bottom = box.y + box.height;

  return {
    id,
    label,
    type,
    bbox: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    },
    imageMap: {
      shape: 'rect',
      coords: [box.x, box.y, right, bottom],
    },
    percent: {
      x: roundPercent(box.x / imageWidth),
      y: roundPercent(box.y / imageHeight),
      width: roundPercent(box.width / imageWidth),
      height: roundPercent(box.height / imageHeight),
    },
    area: box.area,
  };
}

function makeManifest({ kind, sourcePath, maskPath, imageWidth, imageHeight, regions, notes }) {
  return {
    generatedAt: new Date().toISOString(),
    generator: 'scripts/ck3-asset-tools.mjs',
    kind,
    source: toWorkspacePath(sourcePath),
    mask: maskPath ? toWorkspacePath(maskPath) : undefined,
    image: {
      width: imageWidth,
      height: imageHeight,
    },
    notes,
    regions,
  };
}

async function writeAlphaCrop(sourceImage, foregroundMask, box, outputPath) {
  const rawCrop = Buffer.alloc(box.width * box.height * 4);

  for (let cropTop = 0; cropTop < box.height; cropTop += 1) {
    for (let cropLeft = 0; cropLeft < box.width; cropLeft += 1) {
      const sourceLeft = box.x + cropLeft;
      const sourceTop = box.y + cropTop;
      const sourcePixelIndex = sourceTop * sourceImage.width + sourceLeft;
      const sourceDataIndex = sourcePixelIndex * sourceImage.channels;
      const outputDataIndex = (cropTop * box.width + cropLeft) * 4;

      rawCrop[outputDataIndex] = sourceImage.data[sourceDataIndex];
      rawCrop[outputDataIndex + 1] = sourceImage.data[sourceDataIndex + 1];
      rawCrop[outputDataIndex + 2] = sourceImage.data[sourceDataIndex + 2];
      rawCrop[outputDataIndex + 3] = foregroundMask[sourcePixelIndex] ? 255 : 0;
    }
  }

  await sharp(rawCrop, { raw: { width: box.width, height: box.height, channels: 4 } })
    .png()
    .toFile(outputPath);
}

function sampleMedianEdgeColor(image, stride) {
  const samples = [];

  for (let left = 0; left < image.width; left += stride) {
    samples.push(readPixel(image, left, 0));
    samples.push(readPixel(image, left, image.height - 1));
  }

  for (let top = 0; top < image.height; top += stride) {
    samples.push(readPixel(image, 0, top));
    samples.push(readPixel(image, image.width - 1, top));
  }

  return {
    red: median(samples.map((sample) => sample.red)),
    green: median(samples.map((sample) => sample.green)),
    blue: median(samples.map((sample) => sample.blue)),
    alpha: median(samples.map((sample) => sample.alpha)),
  };
}

function countTransparentSamples(image, stride) {
  let transparent = 0;
  let total = 0;

  for (let top = 0; top < image.height; top += stride) {
    for (let left = 0; left < image.width; left += stride) {
      total += 1;
      if (readPixel(image, left, top).alpha < 250) {
        transparent += 1;
      }
    }
  }

  return { transparent, total };
}

function readPixel(image, left, top) {
  const dataIndex = (top * image.width + left) * image.channels;
  return {
    red: image.data[dataIndex],
    green: image.data[dataIndex + 1],
    blue: image.data[dataIndex + 2],
    alpha: image.data[dataIndex + 3],
  };
}

function median(values) {
  const sortedValues = [...values].sort((firstValue, secondValue) => firstValue - secondValue);
  return sortedValues[Math.floor(sortedValues.length / 2)];
}

function colorDistance(firstRed, firstGreen, firstBlue, secondRed, secondGreen, secondBlue) {
  const redDistance = firstRed - secondRed;
  const greenDistance = firstGreen - secondGreen;
  const blueDistance = firstBlue - secondBlue;
  return Math.sqrt(redDistance * redDistance + greenDistance * greenDistance + blueDistance * blueDistance);
}

function colorSaturation(red, green, blue) {
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  if (maxChannel === 0) {
    return 0;
  }

  return (maxChannel - minChannel) / maxChannel;
}

function luma(red, green, blue) {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function parseRegionFlags(flags, key, imageWidth, imageHeight) {
  const values = getRepeatedFlags(flags, key);
  if (values.length === 0 && key === 'region') {
    return [{ x: 0, y: 0, width: imageWidth, height: imageHeight }];
  }

  return values.map((value) => {
    const parts = value.split(',').map((part) => Number(part.trim()));
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
      throw new Error(`--${key} must use x,y,width,height. Received: ${value}`);
    }

    return normalizeBox({ x: parts[0], y: parts[1], width: parts[2], height: parts[3] }, imageWidth, imageHeight);
  });
}

function isInsideAnyRegion(left, top, regions) {
  return regions.some(
    (region) =>
      left >= region.x &&
      left < region.x + region.width &&
      top >= region.y &&
      top < region.y + region.height,
  );
}

async function writeJson(outputPath, value) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeImageMapHtml({ title, imagePath, imageWidth, imageHeight, htmlPath, mapName, regions }) {
  await mkdir(path.dirname(htmlPath), { recursive: true });
  const imageSrc = toPosixPath(path.relative(path.dirname(htmlPath), imagePath));
  const areas = regions
    .map((region) => {
      const coords = region.imageMap.coords.join(',');
      return `    <area shape="rect" coords="${coords}" href="#${region.id}" alt="${escapeHtml(region.label)}" title="${escapeHtml(region.label)}">`;
    })
    .join('\n');
  const overlays = regions
    .map((region) => {
      const style = [
        `left: ${region.percent.x}%`,
        `top: ${region.percent.y}%`,
        `width: ${region.percent.width}%`,
        `height: ${region.percent.height}%`,
      ].join('; ');
      return `      <a id="${region.id}" class="region" style="${style}" href="#${region.id}"><span>${escapeHtml(region.label)}</span></a>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #16130f; color: #f4ead2; }
      main { width: min(100vw, ${imageWidth}px); margin: 0 auto; padding: 16px; box-sizing: border-box; }
      .stage { position: relative; width: 100%; aspect-ratio: ${imageWidth} / ${imageHeight}; }
      img { display: block; width: 100%; height: auto; }
      .region { position: absolute; box-sizing: border-box; border: 2px solid #f6d365; background: rgb(246 211 101 / 13%); color: #fff; text-decoration: none; }
      .region:hover, .region:target { border-color: #ff4d4d; background: rgb(255 77 77 / 20%); z-index: 2; }
      .region span { position: absolute; left: 0; top: 0; max-width: 100%; padding: 2px 4px; background: rgb(0 0 0 / 70%); font-size: 12px; line-height: 1.2; overflow-wrap: anywhere; }
      pre { overflow: auto; background: #211b15; padding: 12px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <div class="stage">
        <img src="${escapeHtml(imageSrc)}" width="${imageWidth}" height="${imageHeight}" usemap="#${mapName}" alt="${escapeHtml(title)}">
${overlays}
      </div>
      <map name="${mapName}">
${areas}
      </map>
      <pre>${escapeHtml(JSON.stringify(regions.map((region) => ({ id: region.id, label: region.label, bbox: region.bbox, imageMap: region.imageMap })), null, 2))}</pre>
    </main>
  </body>
</html>
`;

  await writeFile(htmlPath, html, 'utf8');
}

function slugify(value) {
  const normalized = String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'asset';
}

function roundPercent(value) {
  return Number((value * 100).toFixed(4));
}

function toWorkspacePath(absolutePath) {
  return toPosixPath(path.relative(process.cwd(), absolutePath));
}

function toPosixPath(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
