#!/bin/bash

GREEN='\e[32m'
RESET='\e[0m'

while :
do
  echo -e "${GREEN}"
  echo -e "Run this command now or after reboot: cd ~/mvp-pox-node && sudo ./etny-node-installer.sh"
  echo -e "${RESET}"
  sleep 1
  sleep 1
done
