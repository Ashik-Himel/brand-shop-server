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
    const productsCollection = client.db("brand-shop").collection("products");
    const categoriesCollection = client.db("brand-shop").collection("categories");
    const usersCollection = client.db("brand-shop").collection("users");
    const bannersCollection = client.db("brand-shop").collection("banners");
    const subscribersCollection = client.db("brand-shop").collection("subscribers");

    app.get('/categories', async(req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    })
    app.get('/categories/:category', async(req, res) => {
      const filter = {name: req.params.category};
      const result = await categoriesCollection.findOne(filter);
      res.send(result);
    })

    app.get('/products', async(req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    })
    app.post('/products', async(req, res) => {
      const result = await productsCollection.insertOne(req.body);
      res.send(result);
    })
    app.get('/products/:slug', async(req, res) => {
      const filter = {slug: req.params.slug};
      const result = await productsCollection.findOne(filter);
      res.send(result);
    })
    app.get('/products/categories/:category', async(req, res) => {
      const filter = {category: req.params.category};
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    })

    app.get('/users', async(req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })
    app.put('/users/:email', async(req, res) => {
      const filter = {email: req.params.email};
      const options = {upsert: true};
      const newUser = {
        $set: req.body
      }
      const result = await usersCollection.updateOne(filter, newUser, options);
      res.send(result)
    })
    app.get('/users/:email', async(req, res) => {
      const filter = {email: req.params.email};
      const result = await usersCollection.findOne(filter);
      res.send(result);
    })
    
    app.get('/subscribers', async(req, res) => {
      const result = await subscribersCollection.find().toArray();
      res.send(result);
    })
    app.post('/subscribers', async(req, res) => {
      const result = await subscribersCollection.insertOne(req.body)
      res.send(result);
    })

    app.get('/banners', async(req, res) => {
      const result = await bannersCollection.find().toArray();
      res.send(result);
    })
    app.post('/banners', async(req, res) => {
      const result = await bannersCollection.insertOne(req.body);
      res.send(result);
    })
    app.get('/banners/:category', async(req, res) => {
      const filter = {category : req.params.category};
      const result = await bannersCollection.findOne(filter);
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