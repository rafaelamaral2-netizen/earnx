require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const app  = require("./src/app");
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`EarnX server running → http://localhost:${PORT}`);
});
