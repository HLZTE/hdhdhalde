document.addEventListener('DOMContentLoaded', () => {
    let db;
    const request = indexedDB.open('clickerGame', 1);

    request.onerror = (event) => {
        console.error('Ошибка при открытии IndexedDB', event);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadBalance();
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore('balance', { keyPath: 'id' });
        objectStore.transaction.oncomplete = () => {
            const balanceObjectStore = db.transaction('balance', 'readwrite').objectStore('balance');
            balanceObjectStore.add({ id: 'currentBalance', value: 1, lastUpdate: Date.now(), isMining: false });
        };
    };

    function updateBalance(value) {
        const transaction = db.transaction(['balance'], 'readwrite');
        const objectStore = transaction.objectStore('balance');
        const request = objectStore.get('currentBalance');

        request.onsuccess = (event) => {
            const data = event.target.result;
            data.value = parseInt(data.value) + value;
            objectStore.put(data);

            document.getElementById('balance-value').textContent = data.value;
        };

        request.onerror = (event) => {
            console.error('Ошибка при обновлении баланса', event);
        };
    }

    function loadBalance() {
        const transaction = db.transaction(['balance'], 'readonly');
        const objectStore = transaction.objectStore('balance');
        const request = objectStore.get('currentBalance');

        request.onsuccess = (event) => {
            if (event.target.result) {
                const data = event.target.result;
                document.getElementById('balance-value').textContent = data.value;
            }
        };

        request.onerror = (event) => {
            console.error('Ошибка при загрузке баланса', event);
        };
    }

    const clickButton = document.getElementById('click-button');
    if (clickButton) {
        clickButton.addEventListener('click', (event) => {
            const rect = clickButton.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Добавляем наклон в сторону клика
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * 15;
            const rotateY = (centerX - x) / centerX * 15;
            clickButton.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            // Сбрасываем наклон через 150ms
            setTimeout(() => {
                clickButton.style.transform = '';
            }, 150);

            // Добавляем эффект клика
            const clickEffect = document.createElement('div');
            clickEffect.className = 'click-effect';
            clickEffect.style.left = `${x}px`;
            clickEffect.style.top = `${y}px`;
            clickEffect.textContent = '1';
            clickButton.parentElement.appendChild(clickEffect);

            setTimeout(() => {
                clickEffect.remove();
            }, 1000);

            // Обновляем баланс
            updateBalance(1);
        });
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
        });
    });

    // Устанавливаем главную страницу при загрузке
    document.getElementById('mine-page').classList.add('active');
    document.querySelector('[data-target="mine-page"]').classList.add('active');
});
