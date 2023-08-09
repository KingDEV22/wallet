## Overview

A backend service that stores the latest 1000 transaction of ethereum wallet address - vitalik.eth (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045) 
in the database and generates a report that inlcudes the details of the most contacted wallet address.

Tools: Javascript , Node js, Express js, Alchemy and Supabase

The enpoints : 

"/" : GET - to check the health of the server

"/users/register" : POST - register an user

*sample request body* 
```
{
  "fname": "John",
  "lname": "Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```
on success return 201, on error 400, and on server error 500

"/users/login" : POST - to get the access token

*sample request body* 
```
{
    "email": "john.doe@example.com",
    "password": "securepassword123"
}
```

on success return 200, on error 400, and on server error 500

*sample response body*

```
{
    "auth": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE1NTU1MTZ9.G52dN86LUjHkPvTUs-ADpS2Uz0mR1BXq8B9uEw70K60"
}

```

The below are authenicated with a token in the request header

"/api/data" : POST - store transactions fetch from alchemy in the database

*sample header*

```
{
    "auth": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE1NTU1MTZ9.G52dN86LUjHkPvTUs-ADpS2Uz0mR1BXq8B9uEw70K60"
}

```

on success return 201, on error 400, and on server error 500

"/api/data" : GET - get the stored transaction from the database

*sample header*

```
{
    "auth": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE1NTU1MTZ9.G52dN86LUjHkPvTUs-ADpS2Uz0mR1BXq8B9uEw70K60"
}

```

on success return 200, on error 400, and on server error 500

"/api/report" : GET - get the account details with max transactions.

*sample header*

```
{
    "auth": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTE1NTU1MTZ9.G52dN86LUjHkPvTUs-ADpS2Uz0mR1BXq8B9uEw70K60"
}

```

on success return 200, on error 400, and on server error 500

*sample body*

```
{
    "max_value_txn_hash":"0x37b859272bf5b7687ecd2fd1bd9d4356b8ff8b8ac397d92a397f047355b9a1c9",
    "max_txns_with_address": "0x31e684ad5c33b741b4043bb28ece3b0c1bf9e4d4",
    "date_max_txns": "10/26/2015, 6:58:34 PM"
}
```

### Setup the project

1. clone the repository
2. open terminal

    a. type ```npm install``` to install all the dependency
    
    b. run the command ```node index.js``` to start the server in port 4000 in localhost

