GREEN='\e[32m'
RESET='\e[0m'

while : # Buclă infinită
do
  echo -en "${GREEN}"
  echo -n "Run this command now or after reboot:"
  echo -en "${RESET}"
  sleep 1
  clear # Curăță ecranul
  sleep 1
done &

sec=30
while [ $sec -ge 0 ]; do
  echo -n "System Rebooting in [CTRL+C to cancel]: $sec seconds" && echo -ne "\033[0K\r" && let "sec=sec-1" && sleep 1
done

# Reporniți sistemul aici. 
# Asigurați-vă că aveți permisiunile necesare sau rulați scriptul cu sudo.
sudo reboot
