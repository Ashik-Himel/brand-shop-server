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
    const usersCartCollection = client.db("brand-shop").collection("usersCart");
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
    app.put('/products/:slug', async(req, res) => {
      const filter = {slug: req.params.slug};
      const updatedProduct = {
        $set : req.body
      };
      const result = await productsCollection.updateOne(filter, updatedProduct);
      res.send(result);
    })
    app.get('/products/categories/:category', async(req, res) => {
      const filter = {category: req.params.category};
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    })
    app.get('/products/types/:type', async(req, res) => {
      const filter = {type: req.params.type};
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    })

    app.get('/usersCart/:uid', async(req, res) => {
      const filter = {uid: req.params.uid};
      const result = await usersCartCollection.findOne(filter);

      if (!result) {
        res.send([])
      } else {
        let filter2 = {};
        if (result.items.length === 0) {
          res.send([])
        } else {
          if (result.items.length === 1) {
            const slug = result.items[0][0];
            filter2 = {slug: slug};
          } else {
            const slugs = result.items.map(item => item[0]);
            filter2 = {slug: {$in: slugs}};
          }
          const final = await productsCollection.find(filter2).toArray();
        
          final.forEach(product => {
            for (let i = 0; i < result.items.length; i++) {
              if (product.slug === result.items[i][0]) {
                product.quantity = result.items[i][1];
                product.subTotal = result.items[i][2];
                break;
              }
            }
          })
          res.send(final)
        }
      }
    })
    app.put('/usersCart/:uid', async(req, res) => {
      const filter = {uid: req.params.uid};
      const options = {upsert: true};
      let updatedUsersCart = {};
      const usersCartNow = await usersCartCollection.findOne(filter);

      if (!usersCartNow) {
        updatedUsersCart = {
          $set: req.body
        };
      } else {
        if (usersCartNow.items.length === 0) {
          updatedUsersCart = {
            $set: req.body
          }
        } else {
          if (usersCartNow.items.length === 1) {
            if (usersCartNow.items[0][0] === req.body.items[0][0]) {
              usersCartNow.items[0][1] += req.body.items[0][1];
              usersCartNow.items[0][2] += req.body.items[0][2];
            } else {
              usersCartNow.items.push(req.body.items[0]);
            }
          } else {
            if (usersCartNow.items.flat().includes(req.body.items[0][0])) {
              for(let i = 0; i < usersCartNow.items.length; i++) {
                if (usersCartNow.items[i][0] === req.body.items[0][0]) {
                  usersCartNow.items[i][1] += req.body.items[0][1];
                  usersCartNow.items[i][2] += req.body.items[0][2];
                  break;
                }
              }
            } else {
              usersCartNow.items.push(req.body.items[0]);
            }
          }
          updatedUsersCart = {
            $set: usersCartNow
          }
        }
      }
      
      const result = await usersCartCollection.updateOne(filter, updatedUsersCart, options);
      res.send(result);
    })
    app.delete('/usersCart/:uid/:slug', async(req, res) => {
      const filter = {uid: req.params.uid};
      const cart = await usersCartCollection.findOne(filter);
      for(let i = 0; i < cart.items.length; i++) {
        if (cart.items[i][0] === req.params.slug) {
          cart.items.splice(i, 1);
          break;
        }
      }
      
      const updatedCart = {
        $set: cart
      }
      const result = await usersCartCollection.updateOne(filter, updatedCart);
      res.send(result);
    })
    
    app.put('/subscribers/:subscriber', async(req, res) => {
      const filter = {subscriber: req.params.subscriber};
      const options = {upsert: true};
      const value = {
        $set: req.body
      };
      const result = await subscribersCollection.updateOne(filter, value, options);
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