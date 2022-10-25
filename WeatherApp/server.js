//const axios = require('axios')
const cors = require('cors')
const express = require('express')
const app = express()
app.use(cors());
const port = 3000
const https = require("https")

const path = require("path")
let publicPath = path.resolve(__dirname) //, "public"
app.use(express.static(publicPath))

app.get('/location/:location', locationFun);

app.listen(port, () => console.log(`My Weather App listening on port ${port}!`))

function locationFun(req, res) {
  console.log("locationFun: called");

  // Set-up get
  const apiURL = "https://api.openweathermap.org/data/2.5/forecast?"
  const apiKey = ""
  const apiCityName = req.params.location
  const apiUnits = "metric"
  https.get((apiURL + "q=" + apiCityName + "&appId=" + apiKey + "&units=" + apiUnits),
    (response) => {
      let data = ""
      response.on("data", function (chunk) { // getting data
        console.log("BODY: " + chunk);
        data += chunk
        //console.log(typeof chunk);
      })
      response.on("end", () => { // data is retrieved
        const jsondata = JSON.parse(data)
        res.json(jsondata)
      })
    })
}