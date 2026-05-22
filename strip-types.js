const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const backendSrc = path.join(__dirname, 'backend', 'src');

walk(backendSrc, (filePath) => {
  if (filePath.endsWith('.ts')) {
    const code = fs.readFileSync(filePath, 'utf-8');
    
    const result = babel.transformSync(code, {
      filename: filePath,
      presets: [
        ['@babel/preset-typescript', { isTSX: false, allExtensions: true }],
      ],
      plugins: [
        // Simple regex replace for @/ imports to relative isn't natively in babel without extra plugins,
        // so we will do it via string manipulation before/after.
      ]
    });

    if (result && result.code) {
      let jsCode = result.code;
      
      // Fix @/ imports to use relative paths since we're converting to plain JS without path aliases.
      // E.g. @/services/something -> ../services/something
      const depth = filePath.replace(backendSrc, '').split(path.sep).length - 2;
      const relativePrefix = depth <= 0 ? './' : '../'.repeat(depth);
      jsCode = jsCode.replace(/from ['"]@\/(.*)['"]/g, `from '${relativePrefix}$1.js'`);
      jsCode = jsCode.replace(/import (.*) from ['"]@\/(.*)['"]/g, `import $1 from '${relativePrefix}$2.js'`);
      jsCode = jsCode.replace(/require\(['"]@\/(.*)['"]\)/g, `require('${relativePrefix}$1.js')`);

      // Write .js file
      const jsPath = filePath.replace('.ts', '.js');
      fs.writeFileSync(jsPath, jsCode);
      
      // Delete .ts file
      fs.unlinkSync(filePath);
      console.log(`Converted ${filePath} to .js`);
    }
  }
});

// Also do prisma/seed.ts
const seedPath = path.join(__dirname, 'backend', 'prisma', 'seed.ts');
if (fs.existsSync(seedPath)) {
  const code = fs.readFileSync(seedPath, 'utf-8');
  const result = babel.transformSync(code, {
    filename: seedPath,
    presets: [['@babel/preset-typescript', { isTSX: false, allExtensions: true }]],
  });
  if (result && result.code) {
    fs.writeFileSync(seedPath.replace('.ts', '.js'), result.code);
    fs.unlinkSync(seedPath);
    console.log(`Converted seed.ts to .js`);
  }
}
