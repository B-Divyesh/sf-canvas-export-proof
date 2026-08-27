import sharp from 'sharp';

const source = 'assets/src/topographic-proof-source.png';
await sharp(source).resize(1200, 800, { fit: 'cover' }).avif({ quality: 52 }).toFile('public/assets/topographic-proof-hero.avif');
for (const size of [16, 32, 48, 128]) {
  await sharp('public/icons/mark.svg').resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
console.log('Wrote public/assets/topographic-proof-hero.avif');
