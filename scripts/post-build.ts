import fs from 'fs';
import path from 'path';

console.log('📦 Post-build script started...');

// We standardized everything to use the 'build' folder
const src = path.resolve('build/public/index.html');
const dest = path.resolve('build/index.html');

try {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('✅ Copied build/public/index.html to build/index.html');
    } else {
        console.warn(`⚠️ Could not find ${src} to copy.`);
        console.log('Checking directory listings...');
        try {
            if (fs.existsSync('build')) {
                console.log('build content:', fs.readdirSync('build'));
                if (fs.existsSync('build/public')) {
                    console.log('build/public content:', fs.readdirSync('build/public'));
                }
            } else {
                console.log('❌ build directory does not exist!');
            }
        } catch (e) {
            console.log('Error listing directories:', e.message);
        }
    }
} catch (error) {
    console.error('❌ Error copying index.html:', error);
}
