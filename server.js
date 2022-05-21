const express = require("express");
const https = require("https");
const sqlite3 = require("sqlite3");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;
const jsonParser = bodyParser.json();
const FetchingWeatherMessage = "fetching weather data, please refresh"
const Cities = [
  { id: 0, name: "Pittsburgh, PA, USA", lat: "40.4396", lon: "-79.9762", weather: FetchingWeatherMessage },
  { id: 1, name: "San Jose, CA, USA", lat: "37.3019", lon: "-121.8486", weather: FetchingWeatherMessage },
  { id: 2, name: "New York, NY, USA", lat: "40.6943", lon: "-73.9249", weather: FetchingWeatherMessage },
  { id: 3, name: "Fairbanks, AK, USA", lat: "64.8353", lon: "-147.6534", weather: FetchingWeatherMessage },
  { id: 4, name: "Miami, FL, USA", lat: "25.7839", lon: "-80.2102", weather: FetchingWeatherMessage }
]
const OpenWeatherMapApiKey = process.env.API_KEY;

function refreshWeather() {
  for (const city of Cities) {
    https.get("https://api.openweathermap.org/data/2.5/weather?"
      + new URLSearchParams({
        lat: city.lat,
        lon: city.lon,
        appid: OpenWeatherMapApiKey,
        units: "imperial"
      }), (resp) => {
        let data = "";
        resp.on("data", (d) => {
          data += d;
        });
        resp.on("end", () => {
          data = JSON.parse(data);
          city.weather = `${data.weather[0].description}, ${data.main.temp}℉`;
        });
      }).on("error", (e) => {
        console.error(`Got error: ${e.message}`);
      });
  }
}
refreshWeather(); // load weather upon startup
setInterval(refreshWeather, 3600000); // refresh weather every hour

// pages

app.get("/", (req, res) => {
  res.sendFile("webpages/index.html", { root: __dirname });
});

app.get("/inventory", (req, res) => {
  res.sendFile("webpages/inventory.html", { root: __dirname });
});

app.get("/item", (req, res) => {
  res.sendFile("webpages/item.html", { root: __dirname });
});

app.get("/products", (req, res) => {
  res.sendFile("webpages/products.html", { root: __dirname });
});

// invetory requests

app.get("/show_inventory", (req, res) => {
  const db = new sqlite3.Database("db/database.sqlite3");
  db.all("select * from inventory;", (err, all) => {
    const responseData = []
    if (err) {
      console.log(err.message);
    }
    else {
      for (const row of all) {
        const record = {};
        for (const key in row) {
          if (key === "city") {
            record.city = Cities[row.city].name;
            record.weather = Cities[row.city].weather;
          }
          else {
            record[key] = row[key];
          }
        }
        responseData.push(record);
      }
    }
    res.end(JSON.stringify(responseData));
  });
  db.close();
});

// item request

app.get("/item_lookup", (req, res) => {
  const db = new sqlite3.Database("db/database.sqlite3");
  const responseData = {
    exists: false,
    detail: { color: "", origin: "" },
    inventory: []
  };
  db.serialize(() => {
    db.get("select * from product where product.brand = ? and product.name = ?;",
      req.query.brand, req.query.name, (err, row) => {
        if (err) {
          console.log(err.message);
        }
        else if (row) {
          responseData.exists = true;
          responseData.detail.color = row.color;
          responseData.detail.origin = row.origin;
        }
      });
    db.all(
      "select * from inventory where brand = ? and name = ?;",
      req.query.brand, req.query.name, (err, all) => {
        if (err) {
          console.log(err.message);
        }
        else {
          for (const row of all) {
            responseData.inventory.push({
              city: Cities[row.city].name,
              quantity: row.quantity,
              weather: Cities[row.city].weather
            });
          }
        }
        res.end(JSON.stringify(responseData));
      });
  });
  db.close();
});

app.post("/updateItem", jsonParser, (req, res) => {
  const db = new sqlite3.Database("db/database.sqlite3");
  db.run("replace into product values(?, ?, ?, ?);",
    req.body.brand, req.body.name, req.body.color, req.body.origin,
    (err) => {
      if (err) {
        console.log(err.message);
        res.end(err.message);
      }
      else {
        res.end("Item Updated!");
      }
    });
  db.close();
});

app.delete("/deleteItem", jsonParser, (req, res) => {
  const db = new sqlite3.Database("db/database.sqlite3");
  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");
    db.run("delete from product where brand = ? and name = ?;",
      req.body.brand, req.body.name, (err) => {
        if (err) {
          console.log(err.message);
          res.end(err.message);
        }
        else {
          res.end("Item Deleted!");
        }
      });
  });
  db.close();
});

app.post("/updateInventory", jsonParser, (req, res) => {
  const db = new sqlite3.Database("db/database.sqlite3");
  const responseData = {
    msg: "",
    inventory: []
  };
  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");
    db.run("replace into inventory values(?, ?, ?, ?);",
      req.body.brand, req.body.name, req.body.city, req.body.quantity, (err) => {
        if (err) {
          console.log(err.message);
          responseData.msg = err.message;
        }
        else {
          responseData.msg = "Inventory Updated!"
        }
      });
    db.all("select * from inventory where brand = ? and name = ?;",
      req.body.brand, req.body.name, (err, all) => {
        if (err) {
          console.log(err.message);
        }
        else {
          for (const row of all) {
            const record = {};
            record.city = Cities[row.city].name;
            record.quantity = row.quantity;
            record.weather = Cities[row.city].weather;
            responseData.inventory.push(record);
          }
        }
        res.end(JSON.stringify(responseData));
      });
  });
  db.close();
});

app.delete("/deleteInventory", jsonParser, (req, res) => {
  const db = new sqlite3.Database("db/database.sqlite3");
  const responseData = {
    msg: "",
    inventory: []
  };
  db.serialize(() => {
    db.run("delete from inventory where brand = ? and name = ? and city = ?",
      req.body.brand, req.body.name, req.body.city, (err) => {
        if (err) {
          console.log(err.message);
          responseData.msg = err.message;
        }
        else {
          responseData.msg = "Inventory Deleted!"
        }
      });
    db.all("select * from inventory where brand = ? and name = ?;",
      req.body.brand, req.body.name, (err, all) => {
        if (err) {
          console.log(err.message);
        }
        else {
          for (const row of all) {
            const record = {};
            record.city = Cities[row.city].name;
            record.quantity = row.quantity;
            record.weather = Cities[row.city].weather;
            responseData.inventory.push(record);
          }
        }
        res.end(JSON.stringify(responseData));
      });
  });
  db.close();
});

// products request

app.get("/show_products", (req, res) => {
  const db = new sqlite3.Database("db/database.sqlite3");
  db.all("select * from product;", (err, all) => {
    const responseData = []
    if (err) {
      console.log(err.message);
    }
    else {
      for (const row of all) {
        const record = {};
        for (const key in row) {
          record[key] = row[key];
        }
        responseData.push(record);
      }
    }
    res.end(JSON.stringify(responseData));
  });
  db.close();
});

app.listen(port);
