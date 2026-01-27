const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + file.originalname.replace(/\s/g, '');
    cb(null, uniqueName);
  },
});

module.exports = multer({ storage });