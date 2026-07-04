const fs = require('fs');
if (fs.existsSync('out/index.html')) {
  fs.copyFileSync('out/index.html', 'out/404.html');
}
