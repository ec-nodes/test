const existingAddresses = new Set();
const pendingAddresses = new Set();
const PROGRESS_INTERVAL = 300;
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 1000;
let order = [];

function startProgressAnimation(cell) {
    let progress = 1;
    const progressText = [".", "..", "..."];
    const progressInterval = setInterval(() => {
        cell.textContent = progressText[progress % 4];
        progress++;
    }, PROGRESS_INTERVAL);
    return progressInterval;
}

function stopProgressAnimation(progressInterval) {
    clearInterval(progressInterval);
}

async function fetchTransactions(node) {
    try {
        if (pendingAddresses.has(node.nodeAddress)) return null;

        pendingAddresses.add(node.nodeAddress);

        let retryCount = 0;

        while (retryCount < MAX_RETRIES) {
            try {
                const response = await fetch(`https://blockexplorer.bloxberg.org/api?module=account&action=txlist&address=${node.nodeAddress}`);
                const json = await response.json();
                const nodeTransactionsArray = json.result;

                if (nodeTransactionsArray.length > 0) {
                    existingAddresses.add(node.nodeAddress);
                    pendingAddresses.delete(node.nodeAddress);
                    return { ...node, lastTransactionTime: Math.round((Date.now() / 1000 - nodeTransactionsArray[0].timeStamp) / 3600) };
                }
            } catch (error) {
                console.log(`Error fetching data for ${node.nodeAddress}: ${error}`);
            } finally {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            }
        }

        return null;
    } finally {
        pendingAddresses.delete(node.nodeAddress);
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

    newRow.innerHTML = `<td draggable="true" ondragstart="startDrag(event)">${nodeName}</td><td draggable="true"><a href="https://blockexplorer.bloxberg.org/address/${nodeAddress}">${newNodeAddressText}</a></td><td>${transactionTimeText}</td><td><img src="https://i.ibb.co/xHbVTPk/delete-3.webp" alt="Delete" class="delete-logo"></td>`;

    const deleteLogo = newRow.querySelector('.delete-logo');
    deleteLogo.addEventListener('click', () => {
        const confirmation = confirm("Please confirm this action!");
        if (confirmation) {
            table.deleteRow(newRow.rowIndex);
            deleteNodeFromStorage(nodeAddress);
        }
    });

    const contextMenuCell = newRow.cells[3];
    contextMenuCell.innerHTML = `<div class="context-menu"></div>`;

    const contextMenu = newRow.querySelector('.context-menu');
    newRow.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        showContextMenu(event, nodeAddress, newRow);
    });

    const cell = newRow.cells[2];

    async function updateCellWithTransactionTime() {
        const response = await fetchTransactions({ nodeName, nodeAddress });

        if (!response) {
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            const retryResponse = await fetchTransactions({ nodeName, nodeAddress });
            if (retryResponse) {
                cell.textContent = retryResponse.lastTransactionTime || 'Last Hour';
                stopProgressAnimation(progressInterval);
                if (typeof retryResponse.lastTransactionTime === 'number' && retryResponse.lastTransactionTime > 24) {
                    newRow.classList.add('red-text');
                }
            } else {
                cell.textContent = 'Retrying';
                stopProgressAnimation(progressInterval);

                await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
                const secondRetryResponse = await fetchTransactions({ nodeName, nodeAddress });
                if (secondRetryResponse) {
                    cell.textContent = secondRetryResponse.lastTransactionTime || 'Last Hour';
                    stopProgressAnimation(progressInterval);
                    if (typeof secondRetryResponse.lastTransactionTime === 'number' && secondRetryResponse.lastTransactionTime > 24) {
                        newRow.classList.add('red-text');
                    }
                } else {
                    cell.textContent = 'No Response';
                    stopProgressAnimation(progressInterval);
                }
            }
        } else {
            cell.textContent = response.lastTransactionTime || 'Last Hour';
            stopProgressAnimation(progressInterval);
            if (typeof response.lastTransactionTime === 'number' && response.lastTransactionTime > 24) {
                newRow.classList.add('red-text');
            }
        }
    }

    const progressInterval = startProgressAnimation(cell);
    updateCellWithTransactionTime();
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

async function loadNodesData() {
    const storedNodes = JSON.parse(localStorage.getItem('nodes')) || [];
    const table = document.getElementById('myTable');

    existingAddresses.clear();
    pendingAddresses.clear();

    table.style.display = 'table';

    storedNodes.forEach(({ nodeName, nodeAddress }) => {
        const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
        addNodeToTable(nodeName, nodeAddress, '.');
        existingAddresses.add(nodeAddress);
    });

    await Promise.all(storedNodes.map(async ({ nodeName, nodeAddress }) => {
        try {
            const response = await fetchTransactions({ nodeName, nodeAddress });
            if (response) {
                const newNodeAddressText = generateNewNodeAddressText(nodeAddress);
                const row = table.querySelector(`tr td:nth-child(2) a[href="https://blockexplorer.bloxberg.org/address/${nodeAddress}"]`).parentNode.parentNode;
                const cell = row.cells[2];
                const progressInterval = startProgressAnimation(cell);

                setTimeout(() => {
                    cell.textContent = response.lastTransactionTime || 'Last Hour';
                    stopProgressAnimation(progressInterval);
                }, 1000);

                if (typeof response.lastTransactionTime === 'number' && response.lastTransactionTime > 24) {
                    row.classList.add('red-text');
                }
            }
        } catch (error) {
            console.error(`Error fetching data for ${nodeAddress}: ${error}`);
        }
    }));
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadNodesData();

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

document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('myTable');

    table.addEventListener('mouseover', (event) => {
        const target = event.target;
        if (target.tagName === 'TD') {
            target.parentNode.classList.add('highlight');
        }
    });

    table.addEventListener('mouseout', (event) => {
        const target = event.target;
        if (target.tagName === 'TD') {
            target.parentNode.classList.remove('highlight');
        }
    });
});

function showContextMenu(event, nodeAddress, row) {
    event.preventDefault();

    const contextMenu = row.querySelector('.context-menu');
    contextMenu.innerHTML = `
        <div class="context-menu-option" data-option="edit">Edit</div>
        <div class="context-menu-option" data-option="delete">Delete</div>
    `;

    const contextMenuOptions = row.querySelectorAll('.context-menu-option');
    contextMenuOptions.forEach((option, index) => {
        option.addEventListener('click', () => {
            handleContextMenuOption(option.dataset.option, nodeAddress, row);
        });
    });

    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.left = `${event.clientX}px`;

    document.addEventListener('click', () => {
        contextMenu.innerHTML = '';
    });
}

function handleContextMenuOption(option, nodeAddress, row) {
    switch (option) {
        case 'delete':
            deleteRow(row, nodeAddress);
            break;
        case 'edit':
            editNode(row, nodeAddress);
            break;
        default:
            break;
    }
}

function editNode(row, nodeAddress) {
    const oldNodeName = row.cells[0].textContent;
    const nodeName = prompt("Enter the new node name:", oldNodeName);
    if (nodeName !== null) {
        row.cells[0].textContent = nodeName;
        editNodeInMemory(nodeAddress, oldNodeName, nodeName);
    }

    const oldNodeAddress = nodeAddress;
    const nodeAddressInput = prompt("Enter the new node address:", oldNodeAddress);
    if (nodeAddressInput !== null) {
        // Perform validation or additional checks if needed
        row.cells[1].querySelector('a').href = `https://blockexplorer.bloxberg.org/address/${nodeAddressInput}`;
        row.cells[1].querySelector('a').textContent = generateNewNodeAddressText(nodeAddressInput);
        editNodeAddressInMemory(nodeAddress, nodeAddressInput);
    }
}

function deleteRow(row, nodeAddress) {
    const confirmation = confirm("Please confirm this action!");
    if (confirmation) {
        const table = document.getElementById('myTable');
        table.deleteRow(row.rowIndex);
        deleteNodeFromStorage(nodeAddress);
    }
}

function editNodeName(row, nodeAddress) {
    const oldNodeName = row.cells[0].textContent;
    const nodeName = prompt("Enter the new node name:", oldNodeName);
    if (nodeName !== null) {
        row.cells[0].textContent = nodeName;
        editNodeInMemory(nodeAddress, oldNodeName, nodeName);
    }
}

function editNodeInMemory(oldNodeAddress, oldNodeName, newNodeAddress) {
    const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
    const updatedNodes = nodes.map(node => {
        if (node.nodeAddress === oldNodeAddress && node.nodeName === oldNodeName) {
            return { ...node, nodeName: newNodeAddress };
        }
        return node;
    });
    localStorage.setItem('nodes', JSON.stringify(updatedNodes));
}

function editNodeAddress(row, nodeAddress) {
    const oldNodeAddress = nodeAddress;
    const nodeAddressInput = prompt("Enter the new node address:", oldNodeAddress);
    if (nodeAddressInput !== null) {
        // Perform validation or additional checks if needed
        row.cells[1].querySelector('a').href = `https://blockexplorer.bloxberg.org/address/${nodeAddressInput}`;
        row.cells[1].querySelector('a').textContent = generateNewNodeAddressText(nodeAddressInput);
        editNodeAddressInMemory(nodeAddress, nodeAddressInput);
    }
}

function editNodeAddressInMemory(oldNodeAddress, newNodeAddress) {
    const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
    const updatedNodes = nodes.map(node => {
        if (node.nodeAddress === oldNodeAddress) {
            return { ...node, nodeAddress: newNodeAddress };
        }
        return node;
    });
    localStorage.setItem('nodes', JSON.stringify(updatedNodes));
}

document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('myTable');

    table.addEventListener('dragstart', (event) => {
        const target = event.target;
        if (target.tagName === 'TD') {
            event.dataTransfer.setData('text/plain', target.parentNode.rowIndex);
        }
    });

    table.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    table.addEventListener('drop', (event) => {
        event.preventDefault();
        const target = event.target;
        const data = event.dataTransfer.getData('text/plain');
        const rowIndex = parseInt(data, 10);

        if (target.tagName === 'TD') {
            const targetRow = target.parentNode;

            table.rows[targetRow.rowIndex].parentNode.insertBefore(table.rows[rowIndex], targetRow);

            order = Array.from(table.rows).map(row => row.querySelector('td:nth-child(2) a').textContent);
            localStorage.setItem('rowOrder', JSON.stringify(order));
        }
    });
});

window.addEventListener('beforeunload', () => {
    const table = document.getElementById('myTable');
    const rows = Array.from(table.rows);
    
    order = rows.map(row => row.querySelector('td:nth-child(2) a').textContent);
    localStorage.setItem('rowOrder', JSON.stringify(order));
});
