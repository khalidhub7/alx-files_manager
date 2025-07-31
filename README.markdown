# alx-files_manager

This project is a simple file management system built with Node.js, allowing users to upload, manage, and share files and folders. It features user authentication, file storage, and background processing for generating image thumbnails and sending welcome emails.

## Features

- User registration and authentication
- File and folder creation
- File uploading (supports images and text files)
- File listing with pagination
- File publishing/unpublishing (public/private access)
- Retrieval of file content, including resized image thumbnails
- Background job processing for thumbnail generation and welcome emails

## Technologies Used

- **Node.js**: Core runtime environment
- **Express.js**: Web framework for API development
- **MongoDB**: Database for storing users and files
- **Redis**: Caching and session management
- **Bull**: Job queue management for background tasks
- **image-thumbnail**: Library for generating image thumbnails
- **mime-types**: Determines file MIME types

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/alx-files_manager.git
   cd alx-files_manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the following:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=27017
   DB_DATABASE=files_manager
   REDIS_HOST=localhost
   REDIS_PORT=6379
   FOLDER_PATH=/tmp/files_manager
   ```

4. **Start the server:**
   ```bash
   npm run start-server
   ```

5. **Start the worker (for background jobs):**
   ```bash
   npm run start-worker
   ```

## API Documentation

Below are the available API endpoints with usage examples.

### User Endpoints

- **POST /users**  
  _Register a new user._  
  - Request:
    ```bash
    curl http://0.0.0.0:5000/users \
      -X POST \
      -H "content-type: application/json" \
      -d '{ "email": "bob@dylan.com", "password": "toto1234!" }'
    ```
  - Response:
    ```json
    {"id":"5f1e7d35c7ba06511e683b21","email":"bob@dylan.com"}
    ```

- **GET /connect**  
  _Login with Basic Auth to get an authentication token._  
  - Request:
    ```bash
    curl http://0.0.0.0:5000/connect \
      -H "authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE="
    ```
  - Response:
    ```json
    {"token":"031bffac-3edc-4e51-aaae-1c121317da8a"}
    ```

- **GET /users/me**  
  _Get current user info using the token._  
  - Request:
    ```bash
    curl http://0.0.0.0:5000/users/me \
      -H "x-token: 031bffac-3edc-4e51-aaae-1c121317da8a"
    ```
  - Response:
    ```json
    {"id":"5f1e7cda04a394508232559d","email":"bob@dylan.com"}
    ```

- **GET /disconnect**  
  _Logout by invalidating the token._  
  - Request:
    ```bash
    curl http://0.0.0.0:5000/disconnect \
      -H "x-token: 031bffac-3edc-4e51-aaae-1c121317da8a"
    ```
  - Response: `204 No Content`

### File Endpoints

- **POST /files**  
  _Upload a file or create a folder._  
  - Example: Create a folder
    ```bash
    curl -X POST http://0.0.0.0:5000/files \
      -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" \
      -H "content-type: application/json" \
      -d '{ "name": "images", "type": "folder" }'
    ```
  - Example: Upload a file
    ```bash
    curl -X POST http://0.0.0.0:5000/files \
      -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" \
      -H "content-type: application/json" \
      -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }'
    ```

- **GET /files/:id**  
  _Get file details by ID._  
  - Request:
    ```bash
    curl -X GET http://0.0.0.0:5000/files/5f1e8896c7ba06511e683b25 \
      -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
    ```

- **GET /files**  
  _List files with optional parentId and page parameters._  
  - Request:
    ```bash
    curl -X GET "http://0.0.0.0:5000/files?parentId=5f1e881cc7ba06511e683b23&page=0" \
      -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
    ```

- **PUT /files/:id/publish**  
  _Set a file to public._  
  - Request:
    ```bash
    curl -X PUT http://0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/publish \
      -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
    ```

- **PUT /files/:id/unpublish**  
  _Set a file to private._  
  - Request:
    ```bash
    curl -X PUT http://0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/unpublish \
      -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
    ```

- **GET /files/:id/data**  
  _Get file content, with optional size parameter for images._  
  - Request:
    ```bash
    curl -X GET http://0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data \
      -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
    ```
  - For images with size:
    ```bash
    curl -X GET "http://0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/data?size=100" \
      -H "x-token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
    ```

## Tests

To run the tests, use the following command:

```bash
npm run test tests/controllers/*
```

Here is the test output in a scrollable window:

```
> files_manager@1.0.0 test
> ./node_modules/.bin/mocha --require @babel/register --exit tests/controllers/AppController.test.js tests/controllers/AuthController.test.js tests/controllers/FilesController.test.js tests/controllers/UsersController.test.js

server running at http://localhost:5000
  GET /status - Redis and MongoDB are up
    ✓ returns 200 when Redis and MongoDB are up

  GET /status - server checks for Redis and MongoDB
    ✓ returns 500 when Redis is down
    ✓ returns 500 when MongoDB is down
    ✓ returns 500 when both Redis and MongoDB are down

  GET /stats - returns total users and files
    ✓ responds with 200 and numeric user/file counts (43ms)

  GET /connect - login
    ✓ logs in with valid credentials
    ✓ fails with invalid credentials

  GET /users/me - return user
    ✓ returns the current user with valid token
    ✓ fails with invalid token

  GET /disconnect - logout
    ✓ logs out with valid token
    ✓ fails to log out with invalid token

  POST /files - create files and folders
    ✓ should create a new folder at the root level
    ✓ should create a new folder inside an existing folder
    ✓ should create a new file with base64 data
    ✓ should create a new image and add thumbnail job (285ms)
    ✓ should return 401 if no authentication token is provided
    ✓ should return 400 if name field is missing
    ✓ should return 400 if type field is missing
    ✓ should return 400 if type value is invalid (not folder, file, or image)
    ✓ should return 400 if data field is missing for file or image upload
    ✓ should return 400 if parentId does not reference an existing file
    ✓ should return 400 if parentId references a file that is not a folder

  GET /files/:id - fetch user's file by ID
    ✓ should return 200 and the file if it exists and belongs to the user
    ✓ should return 401 if no auth token is provided
    ✓ should return 404 if the file does not exist or doesn’t belong to the user

  GET /files - list files with pagination
    ✓ should list files in root without parentId or page
    ✓ should list files by parentId (default page 0)
    ✓ should list files by parentId and page
    ✓ should list files in root by page number
    ✓ should return 401 if no auth token

  PUT /files/:id/publish - publish file (set isPublic: true)
    ✓ should successfully publish the file
    ✓ should return 401 if auth token is missing
    ✓ should return 404 if file is not found

  PUT /files/:id/unpublish - unpublish file (set isPublic: false)
    ✓ should successfully unpublish the file

  GET /files/:id/data - return file for guest or authenticated user
    ✓ should returns file for authenticated user (public or private)
    ✓ should returns original image for authenticated user (public or private)
    ✓ should returns resized image for authenticated user (public or private)
    ✓ should returns public file/image for guest (unauthenticated)
    ✓ should return 404 if file ID is invalid
    ✓ should return 404 if file is private and user is not owner
    ✓ should return 400 if file is a folder (no data)
    ✓ should return 404 if file has no local path

  POST /users - user registration tests
    ✓ registers a new user successfully
    ✓ fails when email already exists
    ✓ fails when email is missing
    ✓ fails when password is missing
    ✓ fails when both email and password are missing

  47 passing (907ms)
```