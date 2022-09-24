#!/bin/bash
# build and deploy from google app engine console

echo "Building and deploying..."
git reset --hard HEAD
git pull
yarn install
yarn build
rm -rf node_modules/ package.json README.md src/ webpack.config.js yarn.lock .gitignore .prettierrc
gcloud app deploy --quiet