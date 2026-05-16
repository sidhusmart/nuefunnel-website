import { readdir, mkdir, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, parse, relative } from 'path';
import sharp from 'sharp';

// Configuration
const CONFIG = {
  inputDir: 'public/images/uploads',
  outputDir: 'public/images/optimized',
  widths: [400, 800, 1200],
  quality: 80,
  formats: ['webp'],
};

// Helper to check if file is an image. Includes .webp because Framer
// covers and inline images sometimes arrive as webp; sharp can read them
// natively and re-encode at our target quality/widths.
function isImageFile(filename) {
  const ext = filename.toLowerCase();
  return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.webp');
}

// Get all image files recursively
async function getImageFiles(dir) {
  const images = [];

  if (!existsSync(dir)) {
    console.log(`📁 Upload directory not found: ${dir}`);
    return images;
  }

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      images.push(...await getImageFiles(fullPath));
    } else if (isImageFile(entry.name)) {
      images.push(fullPath);
    }
  }

  return images;
}

// Generate optimized versions of an image
async function optimizeImage(inputPath) {
  const { name, ext } = parse(inputPath);
  const relativePath = relative(CONFIG.inputDir, inputPath);
  const relativeDir = parse(relativePath).dir;

  // Create output directory structure
  const outputSubDir = join(CONFIG.outputDir, relativeDir);
  if (!existsSync(outputSubDir)) {
    await mkdir(outputSubDir, { recursive: true });
  }

  try {
    // Load image and get metadata
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const results = {
      original: {
        path: inputPath,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      },
      optimized: [],
    };

    // Generate optimized versions at different widths
    for (const width of CONFIG.widths) {
      // Skip if original is smaller than target width
      if (metadata.width <= width) {
        continue;
      }

      for (const format of CONFIG.formats) {
        const outputFilename = `${name}-${width}w.${format}`;
        const outputPath = join(outputSubDir, outputFilename);

        await image
          .clone()
          .resize(width, null, {
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: CONFIG.quality })
          .toFile(outputPath);

        const stats = await stat(outputPath);

        results.optimized.push({
          path: outputPath,
          publicPath: `/${relative('public', outputPath)}`,
          width,
          format,
          size: stats.size,
        });
      }
    }

    // Always create a full-width optimized version
    for (const format of CONFIG.formats) {
      const outputFilename = `${name}.${format}`;
      const outputPath = join(outputSubDir, outputFilename);

      await image
        .clone()
        .webp({ quality: CONFIG.quality })
        .toFile(outputPath);

      const stats = await stat(outputPath);

      results.optimized.push({
        path: outputPath,
        publicPath: `/${relative('public', outputPath)}`,
        width: metadata.width,
        format,
        size: stats.size,
      });
    }

    // Save metadata JSON
    const metadataFilename = `${name}.json`;
    const metadataPath = join(outputSubDir, metadataFilename);
    await writeFile(metadataPath, JSON.stringify(results, null, 2));

    return results;
  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message);
    return null;
  }
}

// Format bytes to human-readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Main function
async function main() {
  console.log('🎨 Starting image optimization...\n');

  // Create output directory
  if (!existsSync(CONFIG.outputDir)) {
    await mkdir(CONFIG.outputDir, { recursive: true });
  }

  // Get all images
  const imageFiles = await getImageFiles(CONFIG.inputDir);

  if (imageFiles.length === 0) {
    console.log('✅ No images found to optimize.\n');
    return;
  }

  console.log(`📸 Found ${imageFiles.length} images to optimize\n`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;

  // Process each image
  for (const imagePath of imageFiles) {
    const relativePath = relative(CONFIG.inputDir, imagePath);
    console.log(`⚙️  Processing: ${relativePath}`);

    const result = await optimizeImage(imagePath);

    if (result) {
      processedCount++;

      // Get original file size
      const originalStats = await stat(imagePath);
      totalOriginalSize += originalStats.size;

      // Sum up optimized file sizes
      const optimizedSize = result.optimized.reduce((sum, opt) => sum + opt.size, 0);
      totalOptimizedSize += optimizedSize;

      const savedSize = originalStats.size - optimizedSize;
      const savedPercent = Math.round((savedSize / originalStats.size) * 100);

      console.log(`   ✓ Generated ${result.optimized.length} optimized versions`);
      console.log(`   ✓ Original: ${formatBytes(originalStats.size)} → Optimized: ${formatBytes(optimizedSize)}`);
      console.log(`   ✓ Saved: ${formatBytes(savedSize)} (${savedPercent}%)\n`);
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 Optimization Summary\n');
  console.log(`   Images processed: ${processedCount} / ${imageFiles.length}`);
  console.log(`   Total original size: ${formatBytes(totalOriginalSize)}`);
  console.log(`   Total optimized size: ${formatBytes(totalOptimizedSize)}`);

  if (totalOriginalSize > 0) {
    const totalSaved = totalOriginalSize - totalOptimizedSize;
    const totalPercent = Math.round((totalSaved / totalOriginalSize) * 100);
    console.log(`   Total saved: ${formatBytes(totalSaved)} (${totalPercent}%)`);
  }

  console.log('═'.repeat(60));
  console.log('✅ Image optimization complete!\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
