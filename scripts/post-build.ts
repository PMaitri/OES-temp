
import fs from 'fs';
import path from 'path';

console.log('📦 Post-build script started...');

const src = path.resolve('dist/public/index.html');
const dest = path.resolve('dist/index.html');

try {
    if (fs.existsSync(src)) {
        // Copy to dist/index.html
        fs.copyFileSync(src, dest);
        console.log('✅ Copied dist/public/index.html to dist/index.html');

        // ALSO Copy to build/index.html (Hostinger default)
        if (!fs.existsSync('build')) {
            fs.mkdirSync('build');
        }
        fs.copyFileSync(src, path.resolve('build/index.html'));
        console.log('✅ Copied dist/public/index.html to build/index.html');

    } else {
        // If user's backup code outputs to 'build' or 'public' or something else, we need to handle it.
        console.warn(`⚠️ Could not find ${src} to copy.`);
        console.log('Checking current directory listings...');
        try {
            console.log('dist/', fs.readdirSync('dist'));
            console.log('dist/public/', fs.readdirSync('dist/public'));
        } catch (e) {
            console.log('Error listing directories:', e.message);
        }
    }
} catch (error) {
    console.error('❌ Error copying index.html:', error);
}
