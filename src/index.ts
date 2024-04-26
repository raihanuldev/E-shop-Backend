import express, { Express, Request, Response } from "express";
import cors from "cors";
import { Db, MongoClient, ObjectId, ServerApiVersion } from "mongodb";
require("dotenv").config();

const app: Express = express();
const port = 5000;
// middilware
app.use(cors());
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

    // end-point for all Products
    app.get("/products", async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        console.log(products);
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
