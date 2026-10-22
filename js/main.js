import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Создаем сцену
const scene = new THREE.Scene();
scene.background = null; // Прозрачный фон (чтобы видеть CSS-градиент)

// 2. Создаем камеру
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 3); // Отодвигаем камеру назад

// 3. Создаем рендерер (то, что рисует картинку)
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// 4. Добавляем свет
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Мягкий общий свет
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2); // Солнце
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// 5. Управление камерой (вращение мышкой)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Плавность
controls.dampingFactor = 0.05;
controls.minDistance = 1.5; // Не даем слишком близко приблизиться
controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI / 2 + 0.1; // Запрещаем смотреть снизу

// 6. Загрузка моделей
const loader = new GLTFLoader();
let mannequinGroup = new THREE.Group(); // Группа для манекена и одежды
scene.add(mannequinGroup);

let pantsModel = null;
const loadingText = document.getElementById('loading');
const controlsDiv = document.getElementById('controls');

// Загружаем Манекен
loader.load('./models/mannequin.glb', function (gltf) {
    const model = gltf.scene;
    
    // Центрируем модель (чтобы она была ровно по центру координат)
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.x += (model.position.x - center.x);
    model.position.y += (model.position.y - center.y);
    model.position.z += (model.position.z - center.z);
    
    // Масштабируем, если модель слишком большая или маленькая
    // (Возможно, вам придется подогнать это число, когда добавите свою модель)
    // model.scale.set(1, 1, 1); 

    mannequinGroup.add(model);
    
    // Проверяем загрузились ли штаны
    checkAllLoaded();
}, undefined, function (error) {
    console.error('Ошибка загрузки манекена:', error);
    loadingText.innerText = "Ошибка загрузки манекена (проверьте консоль)";
    loadingText.style.color = "red";
});

// Загружаем Штаны
loader.load('./models/pants.glb', function (gltf) {
    pantsModel = gltf.scene;
    
    // ВАЖНО: Позиционирование штанов. 
    // Изначально мы ставим их так же, как манекен. Вам придется подогнать положение (position) 
    // под ваш конкретный манекен, когда увидите результат.
    
    // Центрируем
    const box = new THREE.Box3().setFromObject(pantsModel);
    const center = box.getCenter(new THREE.Vector3());
    pantsModel.position.x += (pantsModel.position.x - center.x);
    pantsModel.position.y += (pantsModel.position.y - center.y);
    pantsModel.position.z += (pantsModel.position.z - center.z);

    // Временно скрываем штаны
    pantsModel.visible = false;
    
    mannequinGroup.add(pantsModel);
    
    checkAllLoaded();
}, undefined, function (error) {
    console.error('Ошибка загрузки штанов:', error);
    loadingText.innerText = "Ошибка загрузки штанов (проверьте консоль)";
    loadingText.style.color = "red";
});

// Функция проверки загрузки всех моделей
function checkAllLoaded() {
    if (mannequinGroup.children.length >= 1) { // Если манекен загрузился
        loadingText.style.display = 'none';
        controlsDiv.style.display = 'block';
    }
}

// 7. Обработка кнопок
document.getElementById('btn-pants').addEventListener('click', () => {
    if (pantsModel) {
        pantsModel.visible = !pantsModel.visible; // Переключаем видимость
    }
});

// 8. Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 9. Цикл анимации (выполняется 60 раз в секунду)
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Обновляем управление (для плавности)
    renderer.render(scene, camera); // Рисуем кадр
}

animate();
