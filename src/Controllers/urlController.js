const validUrl = require('valid-url')
const shortid = require('shortid')
const urlModel = require("../Models/urlModel")
const redis = require("redis");

//const { promisify } = require("util");
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
const createUrl = async (req, res) => {
    try{

        const longUrl = req.body.longUrl;// destructure the longUrl from req.body.longUrl
        // The API base Url endpoint
        const baseUrl = 'http:localhost:3000'

        if(!longUrl) return res.status(400).send({status: false, message: "longUrl is required"})
         // check base url if valid using the validUrl.isUri method
        if(!validUrl.isUri(baseUrl)){
            return res.status(401).send({status: false, message: "Invalid baseUrl"});
        }
      // if valid, we create the url code
        let urlCode = shortid.generate();
        if(!urlCode) return res.status(400).send({status: false, message: ""})
    // check long url if valid using the validUrl.isUri method
        if(validUrl.isUri(longUrl)){
    
                let url = await urlModel.findOne({longUrl : longUrl}).select({_id: 0, __v: 0});
                // if url exist and return the respose
                if(url){
                    return res.status(200).send({data:url});
                }else{
    
                    // join the generated urlcode to the baseurl
                    let shortUrl = baseUrl + "/" + urlCode;
                    url  = await urlModel.create({longUrl, shortUrl, urlCode});
                    return res.status(201).send({data:url});
                }
        }else{
           return res.status(400).send({status: false, message: "Invalid longUrl"});
        }    

    }catch(err){
        return res.status(500).send({status: false, Error: err.message})
    }
}

const getUrl = async (req, res) => {
    try{
        let code = req.params.urlCode
        let url = await urlModel.findOne({urlCode: code})
        if (url) {
            return res.status(302).redirect(url.longUrl)
        } else {
            return res.status(404).send('No URL Found')
        }
    }catch(err){
        return res.status(500).send({status: false, Error: err.message})
    }
}

module.exports = {createUrl, getUrl}