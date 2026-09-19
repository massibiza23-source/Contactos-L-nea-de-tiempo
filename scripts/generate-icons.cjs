const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const sourceImage = path.join(__dirname, '../src/assets/images/android_app_icon_1789809922329.jpg');
  const publicDir = path.join(__dirname, '../public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating PNG icons from:', sourceImage);

  // 1. Standard 512x512
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 2. Standard 192x192 (standard Android launcher icon)
  await sharp(sourceImage)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 3. Maskable 512x512 (Android adaptive icon with safe zone padding ~15%)
  // We place a 410x410 resized icon in the center of a 512x512 canvas with dark indigo background #0f172a
  const innerIcon = await sharp(sourceImage)
    .resize(410, 410, { fit: 'cover' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  })
    .composite([{ input: innerIcon, top: 51, left: 51 }])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // 4. Apple Touch Icon (180x180)
  await sharp(sourceImage)
    .resize(180, 180, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 5. Favicon 32x32 & 16x16
  await sharp(sourceImage)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(sourceImage)
    .resize(16, 16, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // 6. Shortcut icons (96x96) for Android app shortcuts
  await sharp(sourceImage)
    .resize(96, 96, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'shortcut-icon-96x96.png'));

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
