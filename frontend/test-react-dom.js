try {
  const r = require('react-dom/server');
  console.log('Keys of react-dom/server:', Object.keys(r));
  process.exit(0);
} catch (e) {
  console.error('Error importing react-dom/server:', e.message);
  process.exit(1);
}
