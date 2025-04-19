const fs = require('fs-extra');
const path = require('path');

// 要复制的静态文件目录
const staticDir = path.join(__dirname, 'src', 'routes', 'static');
// 目标目录
const targetDir = path.join(__dirname, 'dist', 'src', 'routes', 'static');

// 确保目标目录存在
fs.ensureDirSync(targetDir);

// 复制静态文件夹内容
try {
  fs.copySync(staticDir, targetDir);
  console.log('静态资源文件已成功复制到编译输出目录！');
} catch (err) {
  console.error('复制静态资源文件时出错:', err);
}
