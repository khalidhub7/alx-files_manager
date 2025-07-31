# users

# register a new user
curl http://0.0.0.0:5000/users \
  -X POST \
  -H "content-type: application/json" \
  -d '{ "email": "bob@dylan.com", "password": "toto1234!" }' && echo ""

# login with basic auth (base64: email:password)
curl http://0.0.0.0:5000/connect \
  -H "authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" && echo ""

# get current user info with x-token
curl http://0.0.0.0:5000/users/me \
  -H "x-token: 0c8d9e18-f61c-45a5-9890-66497b92d205" && echo ""

# logout user with x-token
curl http://0.0.0.0:5000/disconnect \
  -H "x-token: a5422410-e28e-4ed1-9799-6de1bcc05db6" && echo ""

# files

# upload a file (base64 encoded)
curl -X POST http://0.0.0.0:5000/files \
  -H "x-token: a5422410-e28e-4ed1-9799-6de1bcc05db6" \
  -H "content-type: application/json" \
  -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }' && echo ""

# create a folder named "images"
curl -X POST http://0.0.0.0:5000/files \
  -H "x-token: 0db30d6f-0312-46c0-9c86-d3ee8b68bdae" \
  -H "content-type: application/json" \
  -d '{ "name": "images", "type": "folder" }' && echo ""

# get file details by file id (must belong to user)
curl -X GET http://0.0.0.0:5000/files/5f1e8896c7ba06511e683b25 \
  -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" && echo ""

# parentId and page are not specified, so:
# → parentId = 0 (means root folder)
# → page = 0 (first 20 matching files)
# get first 20 root-level files (page = 0, parentId = 0 by default)
curl -X GET http://0.0.0.0:5000/files \
  -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" && echo ""

# get files in folder by parentId (first 20 results, page 0)
curl -X GET "http://0.0.0.0:5000/files?parentId=5f1e881cc7ba06511e683b23" \
  -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" && echo ""

# set file public by id and x-token
curl -X PUT http://0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/publish \
  -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" && echo ""

# set file not public by id and x-token
curl -X PUT http://0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/unpublish \
  -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" && echo ""

# get file content by file id and x-token
curl -X GET http://0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data \
  -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" && echo ""

# return resized image if size is given (100, 250, 500)
curl -XGET http://0.0.0.0:5000/files/6883f05136e0820845b023c2/data?size=100 \
  -o imagefromdb.png



