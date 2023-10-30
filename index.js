const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: ["https://brand-shop-1.web.app", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 5001;

const verify = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.send("Unauthorized access");

  jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
    if (err) return res.send("Forbidden");

    req.user = decode;
    next();
  })
}

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
    const database = client.db("brand-shop");
    const productsCollection = database.collection("products");
    const categoriesCollection = database.collection("categories");
    const usersCartCollection = database.collection("usersCart");
    const bannersCollection = database.collection("banners");
    const subscribersCollection = database.collection("subscribers");

    app.post('/login', (req, res) => {
      const token = jwt.sign(req.body, process.env.JWT_SECRET, {expiresIn: '3d'});
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 259200000
      }).send("Successful");
    })

    app.get('/categories', async(req, res) => {
      const options = {projection: {_id: 0, name: 1, image: 1}}
      const result = await categoriesCollection.find({}, options).toArray();
      res.send(result);
    })
    app.get('/categories/:category', async(req, res) => {
      const filter = {name: req.params.category};
      const options = {projection: {_id: 0, name: 1, image: 1}};
      const result = await categoriesCollection.findOne(filter, options);
      res.send(result);
    })

    app.get('/products', async(req, res) => {
      const options = {projection: {_id: 0, slug: 1, image: 1, name: 1, price: 1, rating: 1}};
      const result = await productsCollection.find({}, options).toArray();
      res.send(result);
    })
    app.post('/products', verify, async(req, res) => {
      if (req.headers.authorization.split(' ')[1] !== req.user.email) return res.send("Forbidden");
      
      const result = await productsCollection.insertOne(req.body);
      res.send(result);
    })
    app.get('/products/:slug', verify, async(req, res) => {
      if (req.headers.authorization.split(' ')[1] !== req.user.email) return res.send("Forbidden");

      const filter = {slug: req.params.slug};
      const options = {projection: {_id: 0, image: 1, name: 1, price: 1, shortDescription: 1, category: 1, type: 1, rating: 1}}
      const result = await productsCollection.findOne(filter, options);
      res.send(result);
    })
    app.put('/products/:slug', verify, async(req, res) => {
      if (req.headers.authorization.split(' ')[1] !== req.user.email) return res.send("Forbidden");

      const filter = {slug: req.params.slug};
      const updatedProduct = {
        $set : req.body
      };
      const result = await productsCollection.updateOne(filter, updatedProduct);
      res.send(result);
    })
    app.get('/products/categories/:category', async(req, res) => {
      const filter = {category: req.params.category};
      const options = {projection: {_id: 0, slug: 1, name: 1, image: 1, type: 1, category: 1, price: 1, rating: 1}};
      const result = await productsCollection.find(filter, options).toArray();
      res.send(result);
    })
    app.get('/products/types/:type', async(req, res) => {
      const filter = {type: req.params.type};
      const options = {projection: {_id: 0, slug: 1, name: 1, image: 1, price: 1, rating: 1}};
      const result = await productsCollection.find(filter, options).limit(4).toArray();
      res.send(result);
    })

    app.get('/usersCart/:uid', verify, async(req, res) => {
      if (req.headers.authorization.split(' ')[1] !== req.user.email) return res.send("Forbidden");

      const filter = {uid: req.params.uid};
      const options = {projection: {_id: 0, items: 1}}
      const result = await usersCartCollection.findOne(filter, options);

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
          const options = {projection: {_id: 0, slug: 1, image: 1, name: 1}}
          const final = await productsCollection.find(filter2, options).toArray();
        
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
    app.put('/usersCart/:uid', verify, async(req, res) => {
      if (req.headers.authorization.split(' ')[1] !== req.user.email) return res.send("Forbidden");

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
    app.delete('/usersCart/:uid/:slug', verify, async(req, res) => {
      if (req.headers.authorization.split(' ')[1] !== req.user.email) return res.send("Forbidden");

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
      const options = {projection: {_id: 0, images: 1}}
      const result = await bannersCollection.findOne(filter, options);
      res.send(result?.images);
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