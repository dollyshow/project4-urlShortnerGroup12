const express = require('express');
const router = express.Router();

const {createUrl, getUrl} = require("../controllers/urlController")

//url api
router.post("/url/shorten", createUrl )
router.get("/:urlCode", getUrl )


module.exports = router;