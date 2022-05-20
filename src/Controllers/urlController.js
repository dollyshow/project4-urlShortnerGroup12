const validUrl = require('valid-url')
const shortid = require('shortid')
const urlModel = require("../Models/urlModel")
const redis = require("redis");

const { promisify } = require("util");
//Connect to redis
const redisClient = redis.createClient(
    15838,
    "redis-15838.c246.us-east-1-4.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("4a0YBCGiGlzMGi7QMOOqhJe3hX6I7Tw7", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });

  
//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

 
const createUrl = async (req, res) => {
    try{

        const data = req.body;
         // The API base Url endpoint
        const baseUrl = 'http:localhost:3000'

        
        if(Object.keys(data).length == 0) return res.status(400).send({status: false, message: "Invalid URL Please Enter valid details"}) 
        if(!data.longUrl) return res.status(400).send({status: false, message: "longUrl is required"})

// check long url if valid using the validUrl.isUri method
        if(validUrl.isUri(data.longUrl)){
    // if url exist and return the respose
                let getUrl = await GET_ASYNC(`${data.longUrl}`)
                let url = JSON.parse(getUrl)
                if(url){
                    return res.status(200).send({status: true, message: "Success",data: url});
                }else{
    // if valid, we create the url code
                    let urlCode = shortid.generate().toLowerCase();
     // join the generated urlcode to the baseurl   
                    let shortUrl = baseUrl + "/" + urlCode;

                    data.urlCode = urlCode
                    data.shortUrl = shortUrl
                     
                    url = await urlModel.create(data)
                    
                    let responseData  = await urlModel.findOne({urlCode:urlCode}).select({_id:0, __v:0,createdAt: 0, updatedAt: 0 });
     //using set to assign new key value pair in cache
                    await SET_ASYNC(`${data.longUrl}`, JSON.stringify(responseData))
                    return res.status(201).send({status: true, message: "URL create successfully",data:responseData});

                }
        }else{
           return res.status(400).send({status: false, message: "Enter a valid Url"});
        }    

    }catch(err){
        return res.status(500).send({status: false, Error: err.message})
    }
}


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const getUrl = async (req,res) => {
    try
    {

        let urlCode = req.params.urlCode 
        //caching
        let cachedLongUrl = await GET_ASYNC(`${urlCode}`)
        
        if(cachedLongUrl){
            
    console.log("redirect from cache")
     return res.status(302).redirect(JSON.parse(cachedLongUrl))
        }
        else{
            const url = await urlModel.findOne({urlCode:urlCode})
            if(!url){
                return res.status(404).send({status:false , message: " no URL found"})
            }
            await SET_ASYNC(`${urlCode}`,JSON.stringify(url.longUrl))
            console.log("redirect from DB")
            return res.status(302).redirect(url.longUrl)
     }
    }
    catch(err){
        return res.status(500).send({status:false ,message: err.message})
    }
}
module.exports = {createUrl, getUrl}