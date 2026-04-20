try {
  const p = require('react-peeps');
  console.log('Keys of react-peeps:', Object.keys(p));
  console.log('Default export:', typeof p.default);
  process.exit(0);
} catch (e) {
  console.error('Error importing react-peeps:', e.message);
  process.exit(1);
}
