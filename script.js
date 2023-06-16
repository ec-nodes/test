    async function fetchTransactions(node) {
      try {
        const response = await fetch(`https://blockexplorer.bloxberg.org/api?module=account&action=txlist&address=${node.nodeAddress}`);
        const json = await response.json();
        const nodeTransactionsArray = json.result;
        if (nodeTransactionsArray.length > 0) {
          const lastTransactionTime = Math.round((Date.now() / 1000 - nodeTransactionsArray[0].timeStamp) / 3600);
          return { ...node, lastTransactionTime };
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
      newRow.innerHTML = `<td>${nodeName}</td><td><a href="https://blockexplorer.bloxberg.org/address/${nodeAddress}">${newNodeAddressText}</a></td><td>${transactionTime}</td><td><img src="https://i.ibb.co/xHbVTPk/delete-3.webp" alt="Delete" class="delete-logo"></td>`;
      const deleteLogo = newRow.querySelector('.delete-logo');
deleteLogo.addEventListener('click', () => {
  const confirmation = confirm("Please confirm this action!");
  if (confirmation) {
    table.deleteRow(newRow.rowIndex);
    deleteNodeFromStorage(nodeAddress);
  }
});
      if (transactionTime !== 'Last Hour' && transactionTime > 15) {
        newRow.classList.add('red-text');
      }
    }

    function deleteNodeFromStorage(nodeAddress) {
      const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
      const updatedNodes = nodes.filter((node) => node.nodeAddress !== nodeAddress);
      localStorage.setItem('nodes', JSON.stringify(updatedNodes));
    }

    function addNodeToDatabase(nodeName, nodeAddress) {
      const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
      const newNode = { nodeName, nodeAddress };
      nodes.push(newNode);
      localStorage.setItem('nodes', JSON.stringify(nodes));
    }

    document.addEventListener('DOMContentLoaded', async () => {
      const storedNodes = JSON.parse(localStorage.getItem('nodes')) || [];
      const table = document.getElementById('myTable');
      const nodeDataArray = await Promise.all(storedNodes.map(fetchTransactions));
      nodeDataArray
        .filter(Boolean)
        .forEach(({ nodeName, nodeAddress, lastTransactionTime }) => {
          const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
          addNodeToTable(nodeName, nodeAddress, lastTransactionTime || 'Last Hour');
        });
      table.style.display = 'table';
    });

    const addNodeBtn = document.getElementById('add-node');

addNodeBtn.addEventListener('click', async () => {
  const nodeName = document.getElementById('node-name').value;
  const nodeAddress = document.getElementById('node-address').value;

  addNodeBtn.classList.add('clicked');
  setTimeout(() => {
    addNodeBtn.classList.remove('clicked');
  }, 140);

  const nodeData = await fetchTransactions({ nodeName, nodeAddress });
  if (nodeData) {
    addNodeToTable(nodeName, nodeAddress, nodeData.lastTransactionTime || 'Last Hour');
    addNodeToDatabase(nodeName, nodeAddress);
    document.getElementById('node-name').value = '';
    document.getElementById('node-address').value = '';
  }
});

    window.addEventListener('resize', () => {
      const addresses = document.querySelectorAll('td:nth-child(2) a');
      addresses.forEach((address) => {
        address.textContent = generateNewNodeAddressText(address.textContent);
      });
    });