const path = require("path");
const fs = require("fs");
const configPath = path.join(__dirname, './static/js/components/config-manager.js');
const configContent = fs.readFileSync(configPath, 'utf-8');
const newContent = configContent.replace(/"path":\s*['"]?[^'"]*['"]?/g, `path: '${454152}'`);
console.log(newContent)
