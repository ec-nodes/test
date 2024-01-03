async function updateCellWithTransactionTime() {
    const response = await fetchTransactions({ nodeName, nodeAddress });

    if (!response) {
        let retryCount = 0;

        while (retryCount < 3) {
            await new Promise((resolve) => setTimeout(resolve, 2500));

            const retryResponse = await fetchTransactions({ nodeName, nodeAddress });

            if (retryResponse) {
                cell.textContent = retryResponse.lastTransactionTime || 'Last Hour';
                stopProgressAnimation(progressInterval);

                if (typeof retryResponse.lastTransactionTime === 'number' && retryResponse.lastTransactionTime > 17) {
                    newRow.classList.add('red-text');
                }

                return;
            }

            retryCount++;
        }

        cell.textContent = 'Network Fail';
        stopProgressAnimation(progressInterval);
    } else {
        cell.textContent = response.lastTransactionTime || 'Last Hour';
        stopProgressAnimation(progressInterval);

        if (typeof response.lastTransactionTime === 'number' && response.lastTransactionTime > 17) {
            newRow.classList.add('red-text');
        }
    }
}
