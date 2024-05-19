import express, { Express, Request, Response } from "express";
import cors from "cors";
import { Db, MongoClient, ObjectId, ServerApiVersion } from "mongodb";
require("dotenv").config();

const app: Express = express();
const port = 5000;
// middilware
const corsOptions = {
  origin: 'http://localhost:3000', // Replace frontend link
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
    const productsCollection = client.db("teach-deal").collection("products");
    const categoriesCollection = client.db("teach-deal").collection("categories");
    const usersCollection = client.db("teach-deal").collection("users");

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
