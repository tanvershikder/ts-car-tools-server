const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();

//middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tfhyr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "unAuthorized access" })
    }
    const token = authHeader.split(" ")[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {

        if (err) {
            return res.status(403).send({ message: "forbidden access" })
        }
        req.decoded = decoded;
        next()
    });
}

async function run() {
    try {
        await client.connect()
        const toolscollection = client.db("ts-car-tools").collection("tools");
        const userCollection = client.db('ts-car-tools').collection('users')
        console.log("connected");

        // get all products
        app.get('/products', async (req, res) => {
            const cursor = toolscollection.find({});
            const result = await cursor.toArray()
            res.send(result)
        })

        //post products
        app.post('/products',verifyJWT, async (req, res) => {
            const product = req.body
            const result = await toolscollection.insertOne(product)
            res.send(result);
        })


        //send user information in to backend i mean mongodb

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET)
            res.send({ result, token })
        })
    }
    finally {

    }
}


run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('ts-car-tools is running')
})

app.listen(port, () => {
    console.log(`port is running on`, port)
})