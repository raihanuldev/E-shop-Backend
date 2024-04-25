import express, { Express, Request, Response } from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
require("dotenv").config();

const app: Express = express();
const port = 5000;
// middilware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

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