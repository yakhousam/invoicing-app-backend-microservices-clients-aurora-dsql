# Clients Microservice

This repository contains a serverless microservice for managing clients. The microservice is built using AWS Lambda, DynamoDB, and the AWS Serverless Application Model (SAM). It provides a set of RESTful API endpoints for creating, updating, retrieving, and deleting client records.

## Features

- **Create Client**: Add a new client to the database.
- **Update Client**: Update an existing client's information.
- **Get Client By ID**: Retrieve a client's information by their ID.
- **Get All Clients**: Retrieve all clients for the authenticated user.
- **Middleware**: Custom middlewares for authorization and duplication checks.

## Project Structure


- **functions/**: Contains the Lambda function handlers.
- **src/**: Contains the source code for controllers, middlewares, utilities, and validation schemas.
- **nodejs/**: Contains the configuration files and dependencies for the Node.js environment.
- **template.yaml**: The SAM template that defines the serverless application.

## Getting Started

### Prerequisites

- Node.js
- AWS CLI
- Docker
- AWS SAM CLI

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yakhousam/invoicing-app-backend-microservices-clients.git 
   cd clients-microservice
   ```

2. Install dependencies:
    ```sh
    cd nodejs
    npm install
    ```

## Running Locally:

1. Start DynamoDB Local in a Docker container:

    ```sh
    docker run --rm -p 8000:8000 -v /tmp:/data amazon/dynamodb-local
   ```

2. Retrieve the ip address of your docker container running dynamodb local:

      ```sh
      docker inspect <container_name_or_id> -f  '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 
    ```

3. Create the DynamoDB table: 
      ```sh
      aws dynamodb create-table --table-name clients --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=clientId,AttributeType=S AttributeName=clientName,AttributeType=S AttributeName=email,AttributeType=S --key-schema AttributeName=userId,KeyType=HASH AttributeName=clientId,KeyType=RANGE --local-secondary-indexes "[{\"IndexName\": \"clientNameIndex\",\"KeySchema\": [{\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"},{\"AttributeName\": \"clientName\", \"KeyType\": \"RANGE\"}],\"Projection\": {\"ProjectionType\": \"ALL\"}},{\"IndexName\": \"emailIndex\",\"KeySchema\": [{\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"},{\"AttributeName\": \"email\", \"KeyType\": \"RANGE\"}],\"Projection\": {\"ProjectionType\": \"ALL\"}}]" --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000
      ```

4. Update env.json with the IP of your docker container for the endpoint override - see here for example:
      ```sh
      {
        "getAllClientsFunction": {
          "ENDPOINT_OVERRIDE": "http://172.17.0.2:8000",
          "TABLE_NAME": "clients",
          "userId": "123456"
        },
        "postClientFunction": {
          "ENDPOINT_OVERRIDE": "http://172.17.0.2:8000",
          "TABLE_NAME": "clients",
          "userId": "123456"
        }
      }
      ```
5. start the SAM local api:
      ```sh
      sam local start-api --env-vars env.json --host 0.0.0.0 --port 3003 --debug
      ```


    ## Testing

      **Run the tests using Vitest:**

      ```sh
      npm run test
      ```

      ## Deployment

      **Deploy the application using the AWS SAM CLI:**

      ```sh
      sam deploy --guided
      ```