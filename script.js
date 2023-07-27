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

  // ... (rest of the code remains unchanged)
});
