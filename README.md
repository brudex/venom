
# Deploying Venom to Docker 
Venom is a mnemonic for vue-express-node-mongodb. In a [previous post](https://medium.com/@brudex/vue-express-node-mysql-venomy-to-docker-8b4c525a9682) I described how to use mysql in place of mongodb. This post is going to be a short one showing an actual venom with docker deployment.  Like the [previous post](https://medium.com/@brudex/vue-express-node-mysql-venomy-to-docker-8b4c525a9682)   this will focus more on the deployment of the stack than on the actual application code. At the end of this post I will provide links to the github repository.

## Generating the node app
Lets do quick run of how the application code was generated : The application code is made up of the server app (nodeapp) which will be hosted on production and the client vuejs app. The server app was generated with yoeman express generator.
The commands to get yoeman and generate the app as follows this time choose mongodb as storage choice.

```sh

    npm install -g yo
    npm install -g generator-express
    yo nodeapp

```

The client app was generated with using vue-cli. Commands to get vue-cli and generate the app :

```sh

    npm install -g @vue/cli
    vue create client

```

The client vue app will be making api calls to the nodeapp(server) over cors. You can start client app by running

```sh
    cd client
    npm run serve
```
  which will lister on port 8080. With hot reloading any changes made to the client app reflects immediately.
To run the server app :

```sh
    cd nodeapp
    npm start ## listening on port 3000
```


 So we have an expressjs backend and a vuejs frontend working together. Cool!! but we can't host the 2 apps separately so we have to merge them for production.

## Merging the apps for production
 To prepare the app for production we are going to merge the client app into the server backend. By default when you run
    `npm run build` 
in the client directory it publishes into a dist folder. We are going to configure the client to publish into the public directory of our server app. In vuejs you can create a `vue.config.js` file to handle this kind of configurations, you learn more about this here `https://cli.vuejs.org/config/#vue-config-js`. Create a vue.config.js file and paste the following code :

```javascript

    const path = require('path');
    module.exports = {
        outputDir: path.resolve(__dirname,'../nodeapp/public'),
        devServer:{
            proxy:{
                '/api':{
                    target: 'http://localhost:3000'
                }
            }
        }
    }
```



The path configuration allows the client to call the server backend on a seprate port only on development machine. 

## Deploying the app with docker.
Now to the meat of matter. How do we dploy to a docker container. Lets create a docker file in the root of our application. Structure of project as follows:
    `venom directory`


```yaml Dockerfile
    -nodeapp
        -app
        -config
        -public
        -app.js
        -package.json
     -client
        -public
        -src
        -package.json
     -node.dockerfile
     -docker-compose.yml
```
 
 By default docker files should be name `Dockerfile` to be automatically loaded by docker compose but we are ninjas we can choose any name and specify that in the compose file so lets call the compose file `node.dockerfile`. Our docker file will contain definitions for building the node app into a container. Lets go over our node.dockerfile explaining each line in a comment. Comments in docker file begin with #


```yaml
    FROM node:12.18.3-alpine3.10   #using node version 12 from alpine image. Tip:alpine images and smaller in size recommended
    LABEL author="brudex:Penrose"  #Specifying the author. Yours truly
    ENV NODE_ENV=production        #Setting or node environment to production. To be read in the nodeapp
    ENV PORT=3000                  #Set the port environment variable to 3000. To be read in the nodeapp
    COPY      nodeapp /var/www     #Copying the contents of nodeapp our application to /var/www in the container
    WORKDIR   /var/www/            #Set our workding directory to /var/www, Context to run subsequent commands
    RUN       npm install          #Install npm modules
    EXPOSE $PORT                   #Expose port 3000 defined above
    ENTRYPOINT ["npm", "start"]    # Run the app

```

Next up we create our docker-compose file. Our docker compose file will contain definitions for building our node service, adding a mongodb database and a mongo-express server for administering our mongodb database. 

```yaml
version: '3.3'
services:
  node:
    container_name: nodeapp
    build:
      context: .
      dockerfile: node.dockerfile
    ports:
      - "3000:3000"
    networks:
      - nodeapp-network
    depends_on:
      - mongo
  mongo:
    image: mongo:4.2.9-bionic
    container_name: mongo
    ports:
      - '27017:27017'
    networks:
      - nodeapp-network
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
      MONGO_INITDB_DATABASE: nodeapp
  mongo_express:
    image: mongo-express
    container_name: mongo_express
    depends_on:
      - 'mongo'
    ports:
      - '8081:8081'
    restart: always
    networks:
      - nodeapp-network
    volumes:
        - ./mongodata:/data/db
    environment:
      ME_CONFIG_MONGODB_SERVER: mongo
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_MONGODB_ENABLE_ADMIN: "true"
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: admin
networks:
  nodeapp-network:
    driver: bridge

```

We are using version 3.3 of docker compose, every compose file must choose from a range of versions `1.0` to `3.8` more about that [here](https://docs.docker.com/compose/compose-file/compose-versioning/#compatibility-matrix). There are 3 services defined in our docker compose file : node (our node app), mongo (our database), mongo-express (web db admin).
  
  ### node service
    The node service is built from the `node.dockerfile`. The container is given a name `nodeapp`. Port 3000 is exposed to be accessible from outside the container. All 3 services is joined to nodeapp-network using a bridge driver.

  ### mongo service
    The mongo service is the database service. It is pulled from the official mongodb image version 4.2.9-bionic on docker hub.


```yaml
      MONGO_INITDB_DATABASE: nodeapp # (optional:mongodb databases are created on first insert) Creates an initial db
      MONGO_INITDB_ROOT_PASSWORD: admin    # Creates an admin user when the service starts
      MONGO_INITDB_ROOT_PASSWORD: admin    # Creates a password for the admin user
```

  ### mongo-express service
    Mongo-Express is a web based MongoDB admin interface. This service pulls the official mongo-express image from docker hub.

```yaml
    ME_CONFIG_MONGODB_SERVER: mongo  # mongodb service host name
    ME_CONFIG_MONGODB_PORT: 27017  # mongodb listening on default port 2017 (optional value required only if port is not default)
    ME_CONFIG_MONGODB_ENABLE_ADMIN: "true" #  Enable administrator access. 
    ME_CONFIG_MONGODB_ADMINUSERNAME: admin # specify admin username if enable admin is true
    ME_CONFIG_MONGODB_ADMINPASSWORD: admin # specify admin password if enable admin is true
```

We are now set to host our service in docker. This tutorial did not focus on installing and setting up docker. You can follow [this](https://docs.docker.com/engine/install/) to install and setup docker.

To lauch our service, on the command line in the venomy directory type :

    `docker-compose up`

This will build the service and lauch all containers simultaneosly. The code for this tutorial is hosted on github 
[https://github.com/brudex/venom](https://github.com/brudex/venom)