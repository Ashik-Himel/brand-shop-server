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
    const productsCollection = client.db("brand-shop").collection("products");

    app.get('/categories', async(req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    })
    app.get('/categories/:category', async(req, res) => {
      const filter = {category: (req.params.category[0].toUpperCase()+req.params.category.slice(1).toLowerCase())};
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    })
    app.get('/products', async(req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    })
    app.get('/products/:slug', async(req, res) => {
      const find = {slug: req.params.slug};
      const result = await productsCollection.findOne(filter);
      res.send(result);
    })
    app.post('/products', async(req, res) => {
      const result = await productsCollection.insertOne(req.body);
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