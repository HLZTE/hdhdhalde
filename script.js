document.addEventListener('DOMContentLoaded', () => {
    let db;
    const request = indexedDB.open('clickerGame', 1);
    const balanceValueElement = document.getElementById('balance-value');
    const balanceContainer = document.getElementById('balance');
    const mineButton = document.getElementById('mine-button');
    let miningInterval;

    request.onerror = (event) => {
        console.error('Ошибка при открытии IndexedDB', event);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadBalance();
        mineButton.disabled = false;
        mineButton.addEventListener('click', () => {
            startMining(true);
        });
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore('balance', { keyPath: 'id' });
        objectStore.transaction.oncomplete = () => {
            const balanceObjectStore = db.transaction('balance', 'readwrite').objectStore('balance');
            balanceObjectStore.add({ id: 'currentBalance', value: 0, lastUpdate: Date.now(), isMining: false });
        };
    };

    function startMining(manualStart = false) {
        clearInterval(miningInterval);

        miningInterval = setInterval(() => {
            const transaction = db.transaction(['balance'], 'readwrite');
            const objectStore = transaction.objectStore('balance');
            const request = objectStore.get('currentBalance');

            request.onsuccess = (event) => {
                const data = event.target.result;
                const now = Date.now();
                const secondsPassed = (now - data.lastUpdate) / 1000;

                data.value = parseFloat(data.value) + (secondsPassed * 0.0000001);
                data.lastUpdate = now;
                if (manualStart) data.isMining = true;
                balanceValueElement.textContent = data.value.toFixed(10);
                objectStore.put(data);
            };

            request.onerror = (event) => {
                console.error('Ошибка при получении баланса', event);
            };
        }, 1000);
    }

    function loadBalance() {
        const transaction = db.transaction(['balance'], 'readonly');
        const objectStore = transaction.objectStore('balance');
        const request = objectStore.get('currentBalance');

        request.onsuccess = (event) => {
            if (event.target.result) {
                const data = event.target.result;
                const now = Date.now();
                const secondsPassed = (now - data.lastUpdate) / 1000;

                if (isNaN(data.value)) {
                    data.value = 0;
                }

                data.value = parseFloat(data.value) + (secondsPassed * 0.0000001);
                data.lastUpdate = now;
                balanceValueElement.textContent = data.value.toFixed(10);

                const updateTransaction = db.transaction(['balance'], 'readwrite');
                const updateObjectStore = updateTransaction.objectStore('balance');
                updateObjectStore.put(data);

                if (data.isMining) {
                    startMining();
                }

                console.log(`Баланс после загрузки: ${data.value}`);
            }
        };

        request.onerror = (event) => {
            console.error('Ошибка при загрузке баланса', event);
        };
    }

    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPageId = button.getAttribute('data-target');
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                page.classList.remove('active');
                page.style.opacity = '0';
                setTimeout(() => {
                    page.style.display = 'none';
                }, 300); // Длительность transition в CSS
            });
            setTimeout(() => {
                const targetPage = document.getElementById(targetPageId);
                targetPage.style.display = 'flex';
                setTimeout(() => {
                    targetPage.classList.add('active');
                    targetPage.style.opacity = '1';
                }, 10); // Небольшая задержка для запуска transition
            }, 300);

            // Обновляем активное состояние кнопок навигации
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Скрываем или показываем баланс
            if (targetPageId === 'mine-page') {
                balanceContainer.classList.remove('hidden');
            } else {
                balanceContainer.classList.add('hidden');
            }
        });
    });
});
