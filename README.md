
# ms-barqi-betes

**Please Read This Documenation Before You Running this Microservice**

This microservices is not tested in any platform services, i tried to deploy to heroku, but nowdays heroku asking credit card details if you want to use their service. but this Microservice working fine on my local


## Installation

Install microservice with npm

```bash
  npm install
```

## Build Project

Since the project is in typescript if you want to build the project you need to ru

```bash
  npm run build
```
    
## Run Locally

Clone the project

```bash
  git clone https://github.com/qinyul/ms-barqi-betes.git
```

Go to the project directory

```bash
  cd ms-barqi-betes ( project directory name )
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```


## Running Tests

To run tests, run the following command

```bash
  npm run test
```


## Tech Stack

**Cache:** Redis

**DB:** MongoDb

**Unit Test:** JEST

**Server:** Node, Express, JWT


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`JWT_SECRET_KEY`

`PORT`

`MONGODB_URI`

`REDIS_PORT` (this is optional if you want to use Redis)

`REDIS_HOST` (this is optional if you want to use Redis)

`CACHE_TTL` (this is optional if you want to use Redis)
