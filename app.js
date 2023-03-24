const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config({path: './config.env' })

const app = express();



// Connect to MongoDB
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
   useCreateIndex: true,
   useFindAndModify: false
})
.then(() =>
  console.log('DB connection successful!'));

  app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


 const communityRouter = require('./routes/community');
 const memberRouter = require('./routes/member');
 const roleRouter = require('./routes/role');
const userRouter = require('./routes/user');

 app.use("/v1/community", communityRouter);
 app.use("/v1/member", memberRouter);
 app.use("/v1/role", roleRouter);
app.use("/v1/user", userRouter);

// Start the server
const port = 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
