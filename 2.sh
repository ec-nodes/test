GREEN='\e[32m'
RESET='\e[0m'

while :
do
  echo -e "${GREEN}"
  echo -e "Run this command now or after reboot: cd ~/mvp-pox-node && sudo ./etny-node-installer.sh"
  echo -e "${RESET}"
  sleep 1
  sleep 1
done &

sec=30
while [ $sec -ge 0 ]; do
  echo -n "System Rebooting in [CTRL+C to cancel]: $sec seconds" && echo -ne "\033[0K\r" && let "sec=sec-1" && sleep 1
done

sudo reboot
