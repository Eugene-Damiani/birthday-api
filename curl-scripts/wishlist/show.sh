#!/bin/sh

API="https://sheltered-lowlands-65291.herokuapp.com"
URL_PATH="/wishlists"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request GET \
  --header "Authorization: Bearer ${TOKEN}"

echo
