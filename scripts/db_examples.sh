# File example

# Stored in DB (includes local file path)
{
  "_id": ObjectId("6881b351c2371e129814450e"),
  "userId": ObjectId("6881863ea1d8275a6a3b58c4"),
  "name": "myText.txt",
  "type": "file",
  "isPublic": false,
  "parentId": 0,
  "localPath": "/tmp/files_manager/a499e837-...c8401"
}

# API response (no localPath, id as string)
{
  "id": "6881b351c2371e129814450e",
  "userId": "6881863ea1d8275a6a3b58c4",
  "name": "myText.txt",
  "type": "file",
  "isPublic": false,
  "parentId": 0
}

# Folder example

# Stored in DB
{
  "_id": ObjectId("6881b358c2371e129814450f"),
  "userId": ObjectId("6881863ea1d8275a6a3b58c4"),
  "name": "images",
  "type": "folder",
  "isPublic": false,
  "parentId": 0
}

# API response (id as string)
{
  "id": "6881b358c2371e129814450f",
  "userId": "6881863ea1d8275a6a3b58c4",
  "name": "images",
  "type": "folder",
  "isPublic": false,
  "parentId": 0
}
