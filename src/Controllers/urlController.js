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
        if(Object.keys(req.body).length == 0 || Object.keys(req.body).length > 1)
        return res.status(400).send({status: false, message: "Invalid request parameters"});
       
        
 // destructure the longUrl from req.body.longUrl
        const longUrl = req.body.longUrl;
// The API base Url endpoint
         const baseUrl = 'http:localhost:3000'
        if(!longUrl) return res.status(400).send({status: false, message: "longUrl is required"})
        if(!validUrl.isUri(baseUrl)){
         return res.status(401).send({status: false, message: "Invalid baseUrl"});
 }
 // if valid, we create the url code
        let urlCode = shortid.generate().toLowerCase();
        if(!urlCode) return res.status(400).send({status: false, message: "invalid"})
 // check long url if valid using the validUrl.isUri method
        if(validUrl.isUri(longUrl)){
    
                let url = await urlModel.findOne({longUrl : longUrl}).select({_id: 0, __v: 0});
  // if url exist and return the respose
                if(url){
 //using set to assign new key value pair in cache
        await SET_ASYNC(`${longUrl}`,JSON.stringify(url))
                    return res.status(200).send({status:true,message:"this longUrl is already present in db",data:url});
                }else{
    
 // join the generated urlcode to the baseurl
                    let shortUrl = baseUrl + "/" + urlCode;
                    url  = await urlModel.create({longUrl, shortUrl, urlCode});
                    return res.status(201).send({status:true,message:"url created successfully",data:url});
                }
        }else{
           return res.status(400).send({status: false, message: "Invalid longUrl"});
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
     return res.status(200).redirect(JSON.parse(cachedLongUrl))
        }
        else{
            const url = await urlModel.findOne({urlCode:urlCode})
            if(!url){
                return res.status(404).send({status:false , message: " no URL found"})
            }
            await SET_ASYNC(`${urlCode}`,JSON.stringify(url.longUrl))
            console.log("redirect from DB")
            return res.status(200).redirect(url.longUrl)
     }
    }
    catch(err){
        return res.status(500).send({status:false ,message: err.message})
    }
}
module.exports = {createUrl, getUrl}