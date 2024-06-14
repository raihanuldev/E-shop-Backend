import express, { Express, Request, Response } from "express";
import cors from "cors";
import { Db, MongoClient, ObjectId, ServerApiVersion } from "mongodb";
require("dotenv").config();

const app: Express = express();
const port = 5000;
// middilware
const corsOptions = {
  // origin: 'http://localhost:3000', // Replace frontend link
  origin: 'https://tech-deal-nextjs.vercel.app', // Replace frontend link
  optionsSuccessStatus: 200,
};


app.use(cors());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uri = process.env.DB_URL as string;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    // collections
    const productsCollection = client.db("teach-deal").collection("test");
    const categoriesCollection = client.db("teach-deal").collection("categories");
    const usersCollection = client.db("teach-deal").collection("users");
    const ordersCollection = client.db('teach-deal').collection("orders")


    app.post('/process-order', async (req: Request, res: Response) => {
      const { product, buyerEmail } = req.body;
      const newProduct = {model:product.model,productId: product._id,sellerEmail: product.sellerEmail,buyerEmail,productImg: product.img,price: product.price}
      const result = await ordersCollection.insertOne(newProduct);
      res.send(result)
  });
  
    app.get('/orders/:email',async(req:Request,res:Response)=>{
      const {email} = req.params;
      const result = await ordersCollection.find({buyerEmail:email}).toArray();
      res.send(result)
    })
    // users endPoint
    app.post("/register", async (req: Request, res: Response) => {
      try {
        const { name, email, password, photoURL, role } = req.body;
    
        // Check if the user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }
    
        // Create a new user
        const newUser = {
          name,
          email,
          password, 
          photoURL,
          role,
          createdAt: new Date(),
        };
    
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ message: "User registered successfully", userId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    // get all users 
    app.get('/users', async (req: Request,res: Response)=>{
      
      try {
        const results = await usersCollection.find({},{
          projection: {name: 1, email:1, _id:1,photoURL:1,role:1,createdAt:1}
        }).toArray();
        res.send(results)
      } catch (error) {
        res.send({ message: "500 Error " });
      }

    })
    // Post New Product
    app.post('/add-product', async (req,res)=>{
      const product = req.body;
      const results =await productsCollection.insertOne(product);
      res.send(results)  // todo highly structure response data
    })
    // end-point for all Products
    app.get("/products", async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        // console.log(products);
        res.send(products);
      } catch (error) {
        res.send({ message: "500 Error " });
      }
    });
    // Search-Products
    app.get('/Search-products', async (req, res) => {
      const query = req.query.query;
      const result = await productsCollection.find({ model: { $regex: query, $options: 'i' } }).toArray();
      res.send(result);
    });

    // Get Specific product by ID
    app.get("/products/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        console.log(productId);
        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Seller Added Products edit Update
    app.put('/api/seller/updateProduct/:productid',async(req,res)=>{
      const productId = req.params.productid;
      const updatedProduct = req.body;
      delete updatedProduct._id;
      try {
        const result = await productsCollection.findOneAndUpdate(
          {_id: new ObjectId(productId)},
          {$set: updatedProduct}
        )
        res.json({message:"Product Updated Succesfully"})
      } catch (error) {
        res.json({message:error})
      }
    })


    //Get Product by email for seller
    app.get('/api/seller/myproducts/:email',async(req,res)=>{
      // console.log(req.params.email);
      try {
        const email = req.params.email;
        const sellerProducts = await productsCollection.find({sellerEmail: email}).toArray();
        // if(!sellerProducts){
        //   return res.status(1000).json({message:"Products not avaible right now. please add new Produts"})
        // }
        res.json(sellerProducts)
      } catch (error) {
        res.status(500).json({text:"Internal Server Error"})
      }
    })
// get currentUserRole
app.get('/api/auth/:email',async(req,res)=>{
  const email = req.params.email;
  try {
    const user = await usersCollection.findOne({email:email})
    res.json(user)
  } catch (error) {
    res.json({});
  }
})

    // categories Information
    app.get('/categories',async(req,res)=>{
      try {
        const categories = await categoriesCollection.find().toArray();
        res.send(categories)
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    })

    // fetch data by category
    app.get('/categoriesProducts/:category', async (req, res) => {
      try {
        const category = req.params.category;
        const products = await productsCollection.find({ category }).toArray();
        res.json(products);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    // just update all products
     // Endpoint to update all products with status: "publish"
     app.put("/update-products-status", async (req: Request, res: Response) => {
      try {
        const updateResult = await productsCollection.updateMany(
          {},
          { $set: { status: "publish" } }
        );
        res.status(200).json({
          message: `${updateResult.modifiedCount} products updated with status: "publish"`,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req: Request, res: Response) => {
  res.send("Hey Welcome your server is running so good");
});
