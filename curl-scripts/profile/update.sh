#!/bin/bash

API="http://localhost:4741"
URL_PATH="/profile"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
--header "Authorization: Bearer ${TOKEN}" \
--data '{
    "profile": {
      "name": "'"${NAME}"'",
      "dob": "'"${DOB}"'",
      "email": "'"${EMAIL}"'"
    }
  }'

echo
