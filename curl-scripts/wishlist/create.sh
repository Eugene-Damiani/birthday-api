#!/bin/bash

API="https://sheltered-lowlands-65291.herokuapp.com"
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
