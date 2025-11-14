const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'public');
const destDir = path.join(__dirname, 'dist', 'public');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(sourceDir)) {
  console.log('Copying public folder to dist...');
  copyRecursiveSync(sourceDir, destDir);
  console.log('✅ Public folder copied successfully!');
} else {
  console.log('⚠️  Public folder not found, skipping...');
}


