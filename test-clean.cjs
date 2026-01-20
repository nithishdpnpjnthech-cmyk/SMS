const bcrypt = require('bcrypt');

const hash = '$2b$10$Ppbp9mk2hjvIa1Qc62SoCuRs19yynaSJobBp/U3s22v0VUR/iOrZe';

bcrypt.compare('meena', hash).then(result => {
  console.log('meena result:', result);
}).catch(err => {
  console.error('Error:', err);
});