# users

# register a new user
curl http://0.0.0.0:5000/users \
  -X POST \
  -H "content-type: application/json" \
  -d '{ "email": "bob@dylan.com", "password": "toto1234!" }' && echo ""

# login with basic auth (base64: email:password)
curl http://0.0.0.0:5000/connect \
  -H "authorization: basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" && echo ""

# get current user info with x-token
curl http://0.0.0.0:5000/users/me \
  -H "x-token: a5422410-e28e-4ed1-9799-6de1bcc05db6" && echo ""

# logout using x-token
curl http://0.0.0.0:5000/disconnect \
  -H "x-token: a5422410-e28e-4ed1-9799-6de1bcc05db6" && echo ""

# files

# upload a file (base64 encoded content)
curl -X POST http://0.0.0.0:5000/files \
  -H "x-token: a5422410-e28e-4ed1-9799-6de1bcc05db6" \
  -H "content-type: application/json" \
  -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }' && echo ""

# create a folder named "images"
curl -X POST http://0.0.0.0:5000/files \
  -H "x-token: a5422410-e28e-4ed1-9799-6de1bcc05db6" \
  -H "content-type: application/json" \
  -d '{ "name": "images", "type": "folder" }' && echo ""

# current x-token
a5422410-e28e-4ed1-9799-6de1bcc05db6



# for file
# saved to db:
{
  "_id": ObjectId("6881b351c2371e129814450e"),
  "userId": ObjectId("6881863ea1d8275a6a3b58c4"),
  "name": "myText.txt", "type": "file", "isPublic": false, "parentId": 0,
  "localPath": "/tmp/files_manager/a499e837-...c8401"
}
# api response:
{
  "id": "6881b351c2371e129814450e",
  "userId": "6881863ea1d8275a6a3b58c4",
  "name": "myText.txt", "type": "file", "isPublic": false, "parentId": 0
}


# for folder
# saved to db:
{
  "_id": ObjectId("6881b358c2371e129814450f"),
  "userId": ObjectId("6881863ea1d8275a6a3b58c4"),
  "name": "images", "type": "folder", "isPublic": false, "parentId": 0
}

# api response:
{
  "id": "6881b358c2371e129814450f",
  "userId": "6881863ea1d8275a6a3b58c4",
  "name": "images", "type": "folder", "isPublic": false, "parentId": 0
}

