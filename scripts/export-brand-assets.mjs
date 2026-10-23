import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = root + 'assets/brand/gradabroad-source.png';
const out = root + 'public/brand/';
await mkdir(out,{recursive:true});
for (const [name,size] of [['gradabroad-instagram-1080.png',1080],['gradabroad-logo-512.png',512],['gradabroad-mark-128.png',128],['google-app-logo-120.png',120],['apple-touch-icon.png',180],['favicon-32.png',32],['favicon-16.png',16]]) {
  await sharp(source).resize(size,size).png({compressionLevel:9}).toFile(out+name);
}
// Keep the old public asset URL useful to existing bookmarks and integrations.
await sharp(source).resize(512,512).png().toFile(root+'public/gradabroad.png');
const icons = await Promise.all([16,32,48].map(size=>sharp(source).resize(size,size).png().toBuffer()));
const header = Buffer.alloc(6+16*icons.length);
header.writeUInt16LE(1,2); header.writeUInt16LE(icons.length,4);
let offset=header.length;
icons.forEach((png,i)=>{const p=6+i*16,s=[16,32,48][i];header[p]=s;header[p+1]=s;header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(png.length,p+8);header.writeUInt32LE(offset,p+12);offset+=png.length;});
await writeFile(root+'public/favicon.ico',Buffer.concat([header,...icons]));
const typography=Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><text x="430" y="302" font-family="Arial,sans-serif" font-weight="700" font-size="76" letter-spacing="-3" fill="#eef2ec">GradAbroad</text><text x="434" y="359" font-family="Arial,sans-serif" font-size="25" fill="#a0aca4">Plan your studies in Germany.</text><text x="104" y="550" font-family="Arial,sans-serif" font-size="19" letter-spacing="2" fill="#c1f3d5">GRADABROAD.ONLINE</text></svg>`);
await sharp({create:{width:1200,height:630,channels:3,background:'#0d1110'}}).composite([{input:await sharp(source).resize(300,300).png().toBuffer(),left:90,top:155},{input:typography,left:0,top:0}]).png().toFile(out+'gradabroad-social-card.png');
console.log('Exported profile image, web/app icons, Google branding logo and social card.');
