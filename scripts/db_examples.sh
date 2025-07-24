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
