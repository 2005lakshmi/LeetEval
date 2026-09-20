const bcrypt = require('bcryptjs');

async function testBcryptSpeed() {
  console.time('bcrypt hash 10 rounds');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);
  console.timeEnd('bcrypt hash 10 rounds');
}

testBcryptSpeed();
