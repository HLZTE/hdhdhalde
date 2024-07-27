document.addEventListener('DOMContentLoaded', () => {
    // Блокировка контекстного меню
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // Блокировка комбинаций клавиш для инспекции элементов
    document.addEventListener('keydown', (event) => {
        if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I') ||
            (event.ctrlKey && event.shiftKey && event.key === 'C') || (event.ctrlKey && event.key === 'U')) {
            event.preventDefault();
            alert('Эта функция отключена.');
        }
    });

    // Блокировка комбинаций клавиш для просмотра исходного кода
    document.addEventListener('keydown', (event) => {
        if (event.key === 'F12' || (event.ctrlKey && event.key === 'U')) {
            event.preventDefault();
        }
    });

    // Блокировка правой кнопки мыши
    document.addEventListener('mousedown', (event) => {
        if (event.button === 2) {
            event.preventDefault();
        }
    });

    // Блокировка действий копирования и выделения текста
    document.addEventListener('copy', (event) => {
        event.preventDefault();
    });

    document.addEventListener('selectstart', (event) => {
        event.preventDefault();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    let db;
    let clickValue = 1; // Initial click value
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
        clickButton.addEventListener('touchstart', (event) => {
            event.preventDefault(); // Prevent default touch actions
            const touches = event.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                createClickEffect(touch.pageX, touch.pageY, touch.identifier);
            }
            updateBalance(clickValue);
        });

        clickButton.addEventListener('touchmove', (event) => {
            event.preventDefault();
            const touches = event.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                updateClickEffect(touch.pageX, touch.pageY, touch.identifier);
            }
        });

        clickButton.addEventListener('touchend', (event) => {
            event.preventDefault();
            const touches = event.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                removeClickEffect(touch.identifier);
            }
        });

        clickButton.addEventListener('click', (event) => {
            const rect = clickButton.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Расчет расстояния от центра до точки клика
            const distanceX = x - centerX;
            const distanceY = y - centerY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            // Устанавливаем максимальный угол поворота
            const maxRotation = 30; // Максимальный угол в градусах
            const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY); // Максимальное расстояние от центра до края

            // Вычисляем угол поворота в зависимости от расстояния
            const rotationX = (distanceY / maxDistance) * maxRotation;
            const rotationY = (distanceX / maxDistance) * maxRotation;

            clickButton.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

            // Сбрасываем наклон через 150ms
            setTimeout(() => {
                clickButton.style.transform = '';
            }, 150);

            createClickEffect(event.clientX, event.clientY, 0); // Use 0 for mouse click identifier
            updateBalance(clickValue);
        });
    }

    function createClickEffect(x, y, identifier) {
        const clickEffect = document.createElement('div');
        clickEffect.className = 'click-effect';
        clickEffect.id = `effect-${identifier}`;
        clickEffect.style.left = `${x}px`;
        clickEffect.style.top = `${y}px`;
        clickEffect.style.transform = `translate(-50%, -50%)`;
        clickEffect.textContent = `+${clickValue}`;
        document.body.appendChild(clickEffect);

        setTimeout(() => {
            clickEffect.remove();
        }, 1000);
    }

    function updateClickEffect(x, y, identifier) {
        const clickEffect = document.getElementById(`effect-${identifier}`);
        if (clickEffect) {
            clickEffect.style.left = `${x}px`;
            clickEffect.style.top = `${y}px`;
        }
    }

    function removeClickEffect(identifier) {
        const clickEffect = document.getElementById(`effect-${identifier}`);
        if (clickEffect) {
            clickEffect.remove();
        }
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

            // Показываем баланс только на странице "Mine"
            const balanceContainer = document.getElementById('balance-container');
            if (targetPageId === 'mine-page') {
                balanceContainer.classList.add('active');
            } else {
                balanceContainer.classList.remove('active');
            }
        });
    });

    // Устанавливаем главную страницу при загрузке
    document.getElementById('mine-page').classList.add('active');
    document.querySelector('[data-target="mine-page"]').classList.add('active');

    // Upgrade button functionality
    const upgradeButton = document.getElementById('upgrade-button');
    if (upgradeButton) {
        upgradeButton.addEventListener('click', () => {
            clickValue += 1;
            showNotification(`Click value upgraded to ${clickValue}!`);
        });
    }

    function showNotification(message) {
        let notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
});
