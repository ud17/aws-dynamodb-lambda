const {DynamoDBClient} = require("@aws-sdk/client-dynamodb");
// setting the region
const REGION = 'us-east-1';
const client = new DynamoDBClient({ region: REGION });

// tablename
const TABLE_NAME = 'product-inventory';

// endpoints
const healthPath = 'health';
const productPath = 'product';
const productsPath = 'products';

exports.handler = async function(event) {
    console.log('Request event: ', event);
    let response;
    switch(true) {
        case event.httpMethod === 'GET' && event.path === healthPath:
            response = buildResponse(200);
            break;
    }
}

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }
}