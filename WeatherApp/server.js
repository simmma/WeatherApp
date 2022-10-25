//const axios = require('axios')
const { json } = require('body-parser');
const cors = require('cors')
const express = require('express')
const app = express()
app.use(cors());
const port = 3001
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
  const apiKey = "ce55cc12159481e25ea6bb2971e2ce57"
  const apiCityName = req.params.location
  const apiUnits = "metric"
  https.get((apiURL + "q=" + apiCityName + "&appId=" + apiKey + "&units=" + apiUnits),
    (response) => {
      let data = ""
      response.on("data", function (chunk) { // getting data
        data += chunk
      })
      response.on("end", () => { // data is retrieved
        const jsondata = JSON.parse(data)
        try { // Will raise error if data is not formatted in expected way?
          // Find range of 4 days
          // Start with next 00:00:00
          let found = false;
          var i = 0;
          while (!found) {
            found = jsondata.list[i].dt_txt.includes("00:00:00")
            i++
          }

          // end of 4-day window
          let j = i + 32;

          // Set-up data structure to be returned
          let formattedData = {
            code: jsondata.cod,
            isRain: false,
            isTemp: [false, false, false], // [COLD, MILD, HOT]
            summary: {
              temp: [],
              wind: [],
              rain: [],
              date: []
            }
          }

          // TODO: Check if any RAIN
          for (let k = i; k <= j || !formattedData.isRain; k++) {
            if (jsondata.list[k].rain != null) {// if it doesn't exist returns null which is falsey
              formattedData.isRain = true
            }
          }

          // TODO: Check if weather is COLD, MILD, HOT
          let tempMin = 25
          let tempMax = 11
          for (let k = i; k <= j; k++) {
            // Adjust min
            if (jsondata.list[k].main.temp_min < tempMin) {
              tempMin = jsondata.list[k].main.temp_min
            }

            //Adjust max
            if (jsondata.list[k].main.temp_max > tempMax) {
              tempMax = jsondata.list[k].main.temp_max
            }
          }
          console.log("tempMax: " + tempMax)
          console.log("tempMin: " + tempMin)
          // set COLD, MILD, HOT
          if (tempMin > 12) {
            formattedData.isTemp[0] = true
          }
          if (tempMin <= 24 && tempMax >= 12) { // temperature will be between min and max?
            formattedData.isTemp[1] = true
          }
          if (tempMax < 24) {
            formattedData.isTemp[2] = true
          }

          // TODO: SUMMARY
          for (let k = i; k < 32; k += 8) { //by day
            let totalTemp = 0
            let totalWind = 0
            let totalRain = 0
            for (let l = 0; l < 8; l++) { // by three hour block
              
              // formattedData.summary.temp.push(jsondata.list[k+l].main.temp)
              // formattedData.summary.wind.push(jsondata.list[k+l].wind.speed)
              // if (jsondata.list[k+l].rain) {
              //     formattedData.summary.rain.push(jsondata.list[k+l].rain["3h"])
              // } else {
              //   formattedData.summary.rain.push(0)
              
              totalTemp += jsondata.list[k+l].main.temp
              totalWind += jsondata.list[k+l].wind.speed
              if (jsondata.list[k+l].rain) {
                  totalRain += jsondata.list[k+l].rain["3h"]
              }
            }
            formattedData.summary.temp.push((totalTemp/8).toFixed(1)) //Convert to avg
            formattedData.summary.wind.push((totalWind/8).toFixed(1)) //Convert to avg
            formattedData.summary.rain.push((totalRain).toFixed(1))
            formattedData.summary.date.push(jsondata.list[k].dt_txt.slice(0,10)) // Date
          }

          console.log(formattedData.summary)

          // Return current data
          res.json(formattedData)
        } catch (e) {
          console.log("error has occurred in server.js");
          console.log(e);
          res.json({
            code: 404, //JSON.parse(data).cod,
            errorName: e.name,
            errorMsg: e.message
          })
        }
      })
    })
}