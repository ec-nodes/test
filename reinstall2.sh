#!/bin/bash

if [ "$(whoami)" != "root" ]; then
  echo "This script must be run as root (sudo)."
  exit 1
fi

USER_HOME=$(eval echo ~$SUDO_USER)

sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv > /dev/null 2>&1
sudo resize2fs /dev/mapper/ubuntu--vg-ubuntu--lv > /dev/null 2>&1

sudo apt-mark unhold "qemu-system-common" "qemu-system-data" "qemu-system-x86" "qemu-utils"

programs_to_uninstall=("qemu-system-common" "qemu-system-data" "qemu-system-x86" "qemu-utils" "vagrant" "libvirt-*" "ansible" "sg3-utils-*" "libsgutils2-2" "acl" "attr" "bridge-utils" "bzip2" "checkpolicy" "cpp-11" "cpu-checker" "dconf-gsettings-backend:amd64" "dnsmasq-base" "ebtables" "exfatprogs" "f2fs-tools" "fontconfig-config" "guile-3.0-libs:amd64" "icu-devtools" "libburn4:amd64" "libc6-dev:amd64" "libnss-libvirt:amd64" "libnss-mymachines:amd64" "libyajl2:amd64" "mtools" "reiserfsprogs" "systemd-container")

total_programs="${#programs_to_uninstall[@]}"
counter=0
progress_bar_width=50

while [ $counter -lt $total_programs ]; do
  percentage=$((counter * 102 / total_programs))
  progress=$((progress_bar_width * counter / total_programs))
  echo -ne "Uninstalling programs: "
  for ((i = 0; i < progress_bar_width; i++)); do
    if [ $i -lt $progress ]; then
      echo -n ">"
    else
      echo -n " "
    fi
  done
  echo -ne " $percentage% \r"
  apt-get purge -y ${programs_to_uninstall[$counter]} --auto-remove > /dev/null 2>&1
  ((counter++))
done

echo
echo "Backup config file ..."
sudo -u $SUDO_USER cp "$USER_HOME/mvp-pox-node/config" "$USER_HOME/"

echo "Removing files & directories..."
rm -f /etc/systemd/system/etny-vagrant.service > /dev/null 2>&1
rm -f /etc/ansible/ansible.cfg > /dev/null 2>&1
rm -f /etc/ansible/hosts > /dev/null 2>&1
rm -f /etc/apt/sources.list.d/ansible-ansible-*.list > /dev/null 2>&1
sudo rm -r /usr/share/fonts/truetype/dejavu/* > /dev/null 2>&1
sudo rm -rf /var/lib/libvirt/qemu > /dev/null 2>&1
sudo rm -rf /var/lib/libvirt/images > /dev/null 2>&1
sudo rm -rf /etc/libvirt > /dev/null 2>&1
sudo rm -rf /etc/apparmor.d/libvirt > /dev/null 2>&1
sudo rm -rf /opt > /dev/null 2>&1
sudo rm -rf /etc/apt/sources.list.d/ > /dev/null 2>&1
sudo rm -rf /var/cache/* /var/cache/.[!.] /var/cache/..?* /var/cache/apt/archives/partial > /dev/null 2>&1
if [ -d "$USER_HOME/mvp-pox-node" ]; then
  echo "Directory 'mvp-pox-node' already exists. Deleting it..."
  rm -rf "$USER_HOME/mvp-pox-node"
fi > /dev/null 2>&1

echo -e "\nUpdating System ..."
sudo add-apt-repository --remove http://ppa.launchpad.net/ethernity-cloud/qemu-sgx/ubuntu > /dev/null 2>&1

sudo apt update && sudo apt upgrade -y > /dev/null 2>&1
echo -e '\n'
apt-get autoremove -y
apt-get clean

echo -e "\nNode Uninstalled & Cleaned successfully! Reinstalling new EC-Node ..."

echo
sudo -u $SUDO_USER git clone https://github.com/ethernity-cloud/mvp-pox-node.git

echo
echo "Recover config file ..."
sudo -u $SUDO_USER cp "$USER_HOME/config" "$USER_HOME/mvp-pox-node/"

GREEN='\e[32m'
RESET='\e[0m'

echo -e "${GREEN}"
echo -e "\nRun this command now or after reboot: cd ~/mvp-pox-node && sudo ./etny-node-installer.sh"
echo -e "${RESET}"

sec=30
while [ $sec -ge 0 ]; do
  echo -n "System Rebooting in [CTRL+C to cancel]: $sec seconds" && echo -ne "\033[0K\r" && let "sec=sec-1" && sleep 1
done

sudo reboot
