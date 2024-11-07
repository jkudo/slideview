const fs = require('fs');
const path = require('path');

function updateSlidesList() {
  const filesDir = path.join(__dirname, '..', 'files');
  const slidesJsonPath = path.join(filesDir, 'slides.json');

  // Get all .pptx files from the files directory
  const files = fs.readdirSync(filesDir)
    .filter(file => file.toLowerCase().endsWith('.pptx'))
    .sort();

  // Create the slides.json content
  const slidesJson = {
    slides: files,
    lastUpdated: new Date().toISOString()
  };

  // Write to slides.json
  fs.writeFileSync(slidesJsonPath, JSON.stringify(slidesJson, null, 2));
  console.log('slides.json has been updated with:', files);
}

// Run immediately
updateSlidesList();

// Watch for changes in the files directory
const filesDir = path.join(__dirname, '..', 'files');
fs.watch(filesDir, (eventType, filename) => {
  if (filename && filename.toLowerCase().endsWith('.pptx')) {
    console.log(`Detected ${eventType} for ${filename}`);
    updateSlidesList();
  }
});

module.exports = updateSlidesList;