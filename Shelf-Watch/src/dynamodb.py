import boto3
import json

dynamodb = boto3.client('dynamodb')

with open('DummyData.json') as f:
    data = json.load(f)

for item in data:
    response = dynamodb.put_item(
        TableName='ShelfWatch',
        Item={
            'item_id': {'S': item['item_id']},
            'name': {'S': item['name']},
            'quantity': {'N': item['quantity']},
            'location': {'S': item['location']},
            'expiration_date': {'S': item['expiration_date']},
        }
    )
    print(response)