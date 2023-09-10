import { DynamoDBClient, GetItemCommand, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
// setting the region
const REGION = 'us-east-1';
const client = new DynamoDBClient({ region: REGION });

// tablename
const tableName = 'product-inventory';

// endpoints
const healthPath = '/health';
const productPath = '/product';
const productsPath = '/products';

export const handler = async(event) => {
    console.log('Request event: ', event);
    let response;
    switch(true) {
        case event.httpMethod === 'GET' && event.path === healthPath:
            response = buildResponse(200);
            break;
        case event.httpMethod === 'GET' && event.path === productPath:
            response = await getProduct(event.queryStringParameters.productId);
            break;
        case event.httpMethod === 'GET' && event.path === productsPath:
            response = await getProducts();
            break;
        case event.httpMethod === 'POST' && event.path === productPath:
            const body = JSON.parse(event.body);
            response = await saveProduct(body);
            break;
        case event.httpMethod === 'PATCH' && event.path === productPath:
            const requestBody = JSON.parse(event.body);
            response = await updateProduct(requestBody.productId, requestBody.updateKey, requestBody.updateValue);
            break;
        case event.httpMethod === 'DELETE' && event.path === productPath:
            response = await deleteProduct(JSON.parse(event.body).productId);
            break;
    }
    return response;
}

async function getProduct(productId) {
    const getProductById = new GetItemCommand({
        TableName: tableName,
        Key: {
            'productId': {
                'S': productId
            }
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
        itemArray = itemArray.concat(data.Items);

        if(data.LastEvaluatedKey) {
            scanParams.ExclusiveStartkey = data.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch(err) {
        console.error('scanDynamoRecords: ', err);
    }
}

async function saveProduct(requestBody) {
    const saveProductQuery = new PutItemCommand({
        TableName: tableName,
        Item: requestBody
    })

    return await client.send(saveProductQuery)
        .then(() => {
            const body = {
                Operation: 'SAVE',
                Message: 'SUCCESS',
                Item: requestBody
            }
            return buildResponse(200, body);
        })
        .catch((error) => {
            console.error('saveProduct: ', error);
        })
}

async function updateProduct(productId, updateKey, updateValue) {
    const updateProductQuery = new UpdateItemCommand({
        TableName: tableName,
        Key: {
            'productId': productId
        },
        UpdateExpression: `set ${updateKey} = :value`,
        ExpressionAttributeValues: {
            ':value': updateValue
        },
        ReturnValues: "UPDATED_NEW"
    })

    return await client.send(updateProductQuery)
        .then((response) => {
            const body = {
                Operation: 'UPDATE',
                Message: 'SUCCESS',
                Item: response
            }
            return buildResponse(200, body);
        })
        .catch((error) => {
            console.error('updateProduct: ', error);
        })
}

async function deleteProduct(productId) {
    const deleteProductQuery = new DeleteItemCommand({
        TableName: tableName,
        Key: {
            'productId': {
                S: productId
            }
        },
        ReturnValues: 'ALL_OLD'
    })

    return await client.send(deleteProductQuery)
        .then((response) => {
            const body = {
                Operation: 'DELETE',
                Message: 'SUCCESS',
                Item: response
            }
            return buildResponse(200, body);
        })
        .catch((error) => {
            console.error('deleteProduct: ', error);
        })
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