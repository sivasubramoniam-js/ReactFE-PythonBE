try {
  const f = require('fabric');
  console.log('Keys of fabric:', Object.keys(f));
  process.exit(0);
} catch (e) {
  console.error('Error importing fabric:', e.message);
  process.exit(1);
}
