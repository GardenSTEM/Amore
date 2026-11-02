const fs = require('fs');
const path = require('path');

function loadEnv(root = path.resolve(__dirname, '..')) {
    const envPath = path.join(root, '.env');
    if (!fs.existsSync(envPath)) return;

    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || process.env[match[1]] !== undefined) continue;

        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        } else {
            value = value.replace(/\s+#.*$/, '').trim();
        }
        process.env[match[1]] = value;
    }
}

module.exports = { loadEnv };
