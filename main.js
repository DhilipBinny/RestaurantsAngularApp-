// load express library
const express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const morgan = require('morgan');
var handlebars  = require('express-handlebars');

//load config.json
const config = require('./config.json')

//look for port
const PORT =  parseInt( process.argv[2])  || parseInt(process.env.APP_PORT) || 3001
// const url = 'mongodb://localhost:27017'
const url = config.mongo || 'mongodb://localhost:27017'


// create an instance of express app
const app = express();

//
const client = new MongoClient(url, { useNewUrlParser : true, useUnifiedTopology: true })


// configure express to use handle-bars
app.engine('hbs', handlebars( {defaultLayout:'default.hbs'} ));
app.set('view engine', 'hbs');

// configure app to use morgan
app.use(morgan('combined'))

//
app.use(express.static(__dirname+'/dist/app1'))

//---------------------------
// GET /api/cuisine
// db.getCollection('restaurant').dictinct('type_of_food')

app.get('/api/cuisine', (req, resp)=>{

    client.db('food')
    .collection('restaurant')
    .distinct('type_of_food')
    .then(result=>{
        console.info('>>> result : ',result)
        var r = result
        r.sort().shift()
        // console.info('>>> result : ',r.sort())
        resp.status(200)
        resp.type('application/json')
        resp.json(r)
    })
    .catch(error=>{
        resp.status(400)
        resp.end(error)
    })
})

// GET /api/restaurants/<Pizza>?offset=<number>,limit=<number>  
//default offset = 0, limit = 10
app.get('/api/restaurants/:cuisine', (req, resp)=>{

    const offset =parseInt(req.query.offset) || 0
    const limit =parseInt(req.query.limit) || 10

    var res  = client.db('food')
    .collection('restaurant')
    .find({'type_of_food':  {'$regex' : req.params.cuisine, '$options' : 'i'}  })
    .sort()
    .project({name:1})
    .skip(offset)
    .limit(limit)
    .toArray()                                        //to convert cursor object into an array of records
    .then(result=>{
        console.info('>>> result : ',result)
        resp.status(200)
        resp.type('application/json')
        resp.json(result)
    })
    .catch(error=>{
        resp.status(400)
        resp.end(error)
    })
})

// GET /api/location/<_id>
app.get('/api/restaurant/:id', (req,resp)=>{
    var id = req.params.id;
    client.db('food')
    .collection('restaurant')
    .findOne( { "_id": ObjectId(id) })
    .then(result => {
        resp.type('application/json')
        console.info('>>> result : ',result)
        if(!result){
            resp.status(404)
            resp.json({message:`Not found : ${id}`})
            return;
        }else{
            resp.status(200)
            resp.json(result)
        }
      })
    .catch(err => {
        console.log(err)
        resp.status(404)
        resp.json({message: err})
    });
})

// connect to MONGO COLLECTION 
client.connect(
    (err,client)=>{
        if(err){
            console.error('fail to connect:',err);
            return;
        }
        console.info('connected to the database..')
        // start the server
        app.listen(PORT, ()=>{
            console.info(`app has started on PORT ${PORT} at ${new Date()}`);
        });
    }
)



