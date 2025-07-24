chmod 444 package.json # read-only
chmod 644 package.json # make it writable again


# start redis server in background and open redis cli
../alx-backend/queuingSystem_inJS/redis-6.0.10/src/redis-server &
../alx-backend/queuingSystem_inJS/redis-6.0.10/src/redis-cli

# create db folder, set permission, then start mongod in background
sudo mkdir -p ./data/db
sudo chmod -R 755 ./data/db
# use this
sudo mongod --dbpath ./data/db/

npm run start-server
npm run test main.test.js
npm run dev redis_main.js

# auto-fix js and python code style
./node_modules/.bin/eslint --fix utils/redis.js
autopep8 --in-place --aggressive --aggressive main/image_upload.py
