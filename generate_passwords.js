const bcrypt = require('bcrypt');
const fs = require('fs');

const rawUsers = [
  {
    username: "admin",
    password: "password123",
    balance: 2345,
    orders: [
      { id: 1024, amount: 120.0 },
      { id: 1023, amount: 64.5 },
      { id: 1022, amount: 88.0 }
    ]
  },
  {
    username: "jessica",
    password: "coolboss88",
    balance: 5200,
    orders: [
      { id: 1030, amount: 300.0 },
      { id: 1029, amount: 200.5 }
    ]
  }
];

(async () => {
  for (const user of rawUsers) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  fs.writeFileSync('users.json', JSON.stringify(rawUsers, null, 2));
  console.log("Hashed passwords written to users.json");
})();