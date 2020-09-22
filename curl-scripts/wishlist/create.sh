#!/bin/bash

API="http://localhost:4741"
URL_PATH="/wishlists"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "wishlist": {
      "name": "'"${NAME}"'",
      "dob": "'"${DOB}"'",
      "item": "'"${ITEM}"'",
      "price": "'"${PRICE}"'",
      "location": "'"${LOCATION}"'"
    }
  }'

echo
