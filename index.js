const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5001;


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.xeaidsx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const categoriesCollection = client.db("brand-shop").collection("categories");

    app.get('/categories', async(req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    })
    app.get('/categories/:name', async(req, res) => {
      const filter = {name: (req.params.name[0].toUpperCase()+req.params.name.slice(1).toLowerCase())};
      const result = await categoriesCollection.findOne(filter);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Database connected!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("Welcome to the Brand Shop's server!");
})
app.listen(port, () => {
  console.log(`Server is running in ${port} port!`);
})

module.exports = app;