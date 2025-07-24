# file example
# stored in db (includes local file path)
{
  "_id": ObjectId("6881b351c2371e129814450e"),
  "userId": ObjectId("6881863ea1d8275a6a3b58c4"),
  "name": "myText.txt",
  "type": "file",
  "isPublic": false,
  "parentId": 0,
  "localPath": "/tmp/files_manager/a499e837-...c8401"
}
# api response (no localPath, id as string)
{
  "id": "6881b351c2371e129814450e",
  "userId": "6881863ea1d8275a6a3b58c4",
  "name": "myText.txt",
  "type": "file",
  "isPublic": false,
  "parentId": 0
}


# folder example
# stored in db
{
  "_id": ObjectId("6881b358c2371e129814450f"),
  "userId": ObjectId("6881863ea1d8275a6a3b58c4"),
  "name": "images",
  "type": "folder",
  "isPublic": false,
  "parentId": "0"
}
# api response (id as string)
{
  "id": "6881b358c2371e129814450f",
  "userId": "6881863ea1d8275a6a3b58c4",
  "name": "images",
  "type": "folder",
  "isPublic": false,
  "parentId": 0
}


# user example
# stored in db
{
  "_id": ObjectId("6881cec11063150e6dcd5860"),
  "email": "a753j65xer8@me.com",
  "password": "f2eadbcc795225e95a41a479cca6c9d44f98d38c"
}
