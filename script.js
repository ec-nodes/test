async function fetchTransactions(nodeAddress) {
  try {
    const response = await fetch(`https://blockexplorer.bloxberg.org/api?module=account&action=txlist&address=${nodeAddress}`);
    const data = await response.json();
    if (data.result && data.result.length > 0) {
      const lastTransaction = data.result[0];
      const lastCallTimestamp = lastTransaction.timeStamp * 1000;
      const currentTime = Date.now();
      const timeDifference = currentTime - lastCallTimestamp;
      const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));
      const minutesDifference = Math.floor(timeDifference / (1000 * 60));
      return hoursDifference > 0 ? `${hoursDifference} h` : `${minutesDifference} min`;
    } else {
      return "N/A";
    }
  } catch (error) {
    console.log(error);
    return; // Add this line to return undefined on error.
  }
}

function generateNewNodeAddressText(nodeAddress) {
  return window.innerWidth < window.innerHeight ? `${nodeAddress.substr(0, 5)}. . .${nodeAddress.substr(-4)}` : nodeAddress;
}

function addNodeToTable(nodeName, nodeAddress, transactionTime) {
  const table = document.getElementById('myTable');
  const newRow = table.insertRow();
  const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
  
  const transactionTimeText = typeof transactionTime === 'number' ? `${transactionTime} h` : transactionTime;
  
  newRow.innerHTML = `<td>${nodeName}</td><td><a href="https://blockexplorer.bloxberg.org/address/${nodeAddress}">${newNodeAddressText}</a></td><td>${transactionTimeText}</td><td><img src="https://i.ibb.co/xHbVTPk/delete-3.webp" alt="Delete" class="delete-logo"></td>`;
  const deleteLogo = newRow.querySelector('.delete-logo');
  deleteLogo.addEventListener('click', () => {
    const confirmation = confirm("Please confirm this action!");
    if (confirmation) {
      table.deleteRow(newRow.rowIndex);
      deleteNodeFromStorage(nodeAddress);
    }
  });
  if (typeof transactionTime === 'number' && transactionTime > 14) {
    newRow.classList.add('red-text');
  }
}

nodeDataArray
  .filter((transactionTime) => typeof transactionTime === 'number')
  .forEach((transactionTime, index) => {
    const { nodeName, nodeAddress } = storedNodes[index];
    const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
    addNodeToTable(nodeName, nodeAddress, transactionTime || 'Last Hour');
    existingAddresses.add(nodeAddress);
    if (transactionTime > 14) {
      const tableRows = table.getElementsByTagName('tr');
      tableRows[tableRows.length - 1].classList.add('red-text');
    }
  });


const nodeNameInput = document.getElementById('node-name');
const nodeAddressInput = document.getElementById('node-address');
const addNodeBtn = document.getElementById('add-node');

nodeNameInput.addEventListener('keyup', (event) => {
  if (event.keyCode === 13) {
    event.preventDefault();
    addNodeBtn.click();
  }
});

nodeAddressInput.addEventListener('keyup', (event) => {
  if (event.keyCode === 13) {
    event.preventDefault();
    addNodeBtn.click();
  }
});

function deleteNodeFromStorage(nodeAddress) {
  const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
  const updatedNodes = nodes.filter((node) => node.nodeAddress !== nodeAddress);
  localStorage.setItem('nodes', JSON.stringify(updatedNodes));
}

function addNodeToDatabase(nodeName, nodeAddress) {
  if (nodeName.trim() === '' || nodeAddress.trim() === '') {
    alert('Please complete both fields!');
    return;
  }

  const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
  const newNode = { nodeName, nodeAddress };
  nodes.push(newNode);
  localStorage.setItem('nodes', JSON.stringify(nodes));
}

document.addEventListener('DOMContentLoaded', async () => {
  const storedNodes = JSON.parse(localStorage.getItem('nodes')) || [];
  const table = document.getElementById('myTable');
  const existingAddresses = new Set();

  const addresses = Array.from(table.querySelectorAll('td:nth-child(2) a'));
  addresses.forEach(address => {
    existingAddresses.add(address.textContent);
  });

  const nodeDataArray = await Promise.all(storedNodes.map(nodeAddress => fetchTransactions(nodeAddress.nodeAddress)));
  nodeDataArray
    .filter(Boolean)
    .forEach((transactionTime, index) => {
      const { nodeName, nodeAddress } = storedNodes[index];
      const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
      addNodeToTable(nodeName, nodeAddress, transactionTime || 'Last Hour');
      existingAddresses.add(nodeAddress);
    });
  table.style.display = 'table';

  const addNodeBtn = document.getElementById('add-node');

  addNodeBtn.addEventListener('click', async () => {
    const nodeName = document.getElementById('node-name').value;
    const nodeAddress = document.getElementById('node-address').value;

    if (nodeName.trim() === '' || nodeAddress.trim() === '') {
      alert('Please complete both fields!');
      return;
    }

    if (existingAddresses.has(nodeAddress)) {
      alert('This address already exists!');
      return;
    }

    addNodeBtn.classList.add('clicked');
    setTimeout(() => {
      addNodeBtn.classList.remove('clicked');
    }, 120);

    const nodeData = await fetchTransactions({ nodeName, nodeAddress });
    if (nodeData) {
      addNodeToTable(nodeName, nodeAddress, nodeData.lastTransactionTime || 'Last Hour');
      addNodeToDatabase(nodeName, nodeAddress);
      document.getElementById('node-name').value = '';
      document.getElementById('node-address').value = '';
      existingAddresses.add(nodeAddress);
    }
  });
});

window.addEventListener('resize', () => {
  const addresses = document.querySelectorAll('td:nth-child(2) a');
  addresses.forEach((address) => {
    address.textContent = generateNewNodeAddressText(address.textContent);
  });
});

function downloadBackupJSON() {
  const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
  const backupData = JSON.stringify(nodes, null, 2);
  const blob = new Blob([backupData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'Nodes_Backup.json';
  link.click();

  URL.revokeObjectURL(url);
}

function restoreBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const contents = await file.text();
    try {
      const nodes = JSON.parse(contents);
      if (Array.isArray(nodes)) {
        localStorage.setItem('nodes', JSON.stringify(nodes));
        location.reload();
      } else {
        throw new Error('Invalid backup file format.');
      }
    } catch (error) {
      console.log('Error parsing backup file:', error);
      alert('Error parsing backup file. Please make sure the file is in the correct format.');
    }
  });
  input.click();
}

const downloadBackupBtn = document.getElementById('download-backup');
downloadBackupBtn.addEventListener('click', downloadBackupJSON);

const restoreBackupBtn = document.getElementById('restore-backup');
restoreBackupBtn.addEventListener('click', restoreBackup);
