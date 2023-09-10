const {DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand} = require("@aws-sdk/client-dynamodb");
// setting the region
const REGION = 'us-east-1';
const client = new DynamoDBClient({ region: REGION });

// tablename
const tableName = 'product-inventory';

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
        case event.httpMethod === 'GET' && event.path === healthPath:
            response = await getProduct(event.queryStringParameters.productId);
            break;
        case event.httpMethod === 'GET' && event.path === healthPath:
            response = await getProducts();
            break;
        case event.httpMethod === 'POST' && event.path === healthPath:
            response = await saveProduct(JSON.parse(event.body));
            break;
        case event.httpMethod === 'PATCH' && event.path === healthPath:
            const requestBody = JSON.parse(event.body);
            response = await updateProduct(requestBody.productId, requestBody.updateKey, requestBody.updateValue);
            break;
        case event.httpMethod === 'DELETE' && event.path === healthPath:
            response = await deleteProduct(JSON.parse(event.body).productId);
            break;
    }
    return response;
}

async function getProduct(productId) {
    const getProductById = new GetItemCommand({
        TableName: tableName,
        Key: {
            'productId': productId
        }
    });

    return await client.send(getProductById)
        .then(response => {
            return buildResponse(200, response.Item);
        })
        .catch(err => {
            console.error('getProduct: ', err);
        })
}

async function getProducts() {
    const getAllProductsQuery = new ScanCommand({
        TableName: tableName
    })
    const allProducts = await scanDynamoRecords(getAllProductsQuery, []);
    const body = {
        products: allProducts
    }
    return buildResponse(200, body);
}

async function scanDynamoRecords(scanParams, itemArray) {
    try{
        const data = await client.send(scanParams);
        itemArray = itemArray.concat;

        if(data.LastEvaluatedKey) {
            scanParams.ExclusiveStartKey = data.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch(err) {
        console.error('scanDynamoRecords: ', err);
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