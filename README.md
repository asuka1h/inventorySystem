# Inventory System
An inventory tracking web application for a logistics company
## Chosen Optional Requirement
- **Push a button export product data to a CSV**
## Run Application
### on [Replit](https://replit.com/)
- visit https://replit.com/@asuka1h/inventorySystem
###  on Linux
#### Prerequisites
- install [Node.js](https://nodejs.org/en/download/)
- get an API key from [OpenWeather](https://openweathermap.org/)
#### Steps
- change to project root directory
    ```
    $ cd inventorySystem
    ```
- install node packages
    ```
    $ npm install
    ```
- run the application with environment variable `API_KEY` set to OpenWeather API key
    ```
    $ API_KEY=<OpenWeather API key> node server.js
    ```
- open a brower and access http://127.0.0.1:3000
## Mannual
### Home Page
Click `Show Products` to view all products in the system.

Click `Show Inventory` to view all inventory in the systems.

Click `Manage Item` to view or edit a single product and update its inventory information.
### Show Products Page
A table of all products will be rendered upon entering this page. Click `Manage Item` on a row to jump to **Manage Item Page** to manage the selected product.

Click `Export to CSV` to **save the product data as a CSV file**.

Click `Home` to return to **Home Page**.
### Show Inventory Page
A table of all inventory will be rendered upon entering this page. Click `Manage Item` on a row to jump to **Manage Item Page** to manage the selected product.

Click `Home` to return to **Home Page**.
### Manage Item Page
Fill in `Item Brand` and `Item Name` and click `Item Lookup` to search a product in the system. If the product is found, a table of the product's details will be redendered in **Item Detail section**, otherwise, an empty table will be rendered.

Click `Reset` to clear the search results and reload the page.
#### Item Detail Section
Fill in or update the table in **Item Detail section**, and click `Update Item` to create or update a product.

If the product is in the system, click `Delete Item` to remove it from the system as well as its inventory information.
#### Inventory Section
If the product is in stock, a table of its inventory information will be rendered in **Inventory section**. An **Update Inventory section** will also be created to allow updating the inventory information.
#### Update Inventory Section
In **Update Inventory section**, select a city from the list, fill in a new quantity, and click `Submit` to send the updates. If the quantity is **0**, the inventory record for the selected city will be removed (if there is one).

Click `Home` to return to **Home Page**.
## Development
### Assumptions
- A product can be uniquely identified by its **brand and name**.
- There are only **5** cities applicable to this system:
    - Pittsburgh, PA, USA
    - San Jose, CA, USA
    - New York, NY, USA
    - Fairbanks, AK, USA
    - Miami, FL, USA
- A product has only **2** detailed properties:
    - color: the color of the product
    - origin: the country of origin of the product
### Data Source
- The geographic coordinates of a city is extracted from [simplemaps - World Cities Database](https://simplemaps.com/data/world-cities) and are hardcoded in the system.
- The weather information of a geographic location is loaded from [OpenWeather](https://openweathermap.org/) upon application startup and is refreshed every hour.
### Database
This application uses [sqlite3](https://www.npmjs.com/package/sqlite3) API to store product and inventory data in `db/database.sqlite3`. The following tables are pre-created in the database file:
```sql
create table product (
    brand text,
    name text,
    color text,
    origin text,
    primary key (brand, name)
);

create table inventory (
    brand text,
    name text,
    city integer,
    quantity integer,
    primary key (brand, name, city),
    foreign key (brand, name)
        references product (brand, name)
            on delete cascade
);
```
