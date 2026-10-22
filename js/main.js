import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Создаем сцену
const scene = new THREE.Scene();

// 2. Камера
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 3); 

// 3. Рендерер (с альфа-каналом для прозрачности)
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// 4. Свет (сделаем его ярче)
const ambientLight = new THREE.AmbientLight(0xffffff, 2); 
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
dirLight1.position.set(5, 10, 5);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight2.position.set(-5, 5, -5);
scene.add(dirLight2);

// 5. Управление камерой
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 6;
controls.target.set(0, 1, 0); // Смотрим на центр манекена

// 6. Включаем камеру (AR-режим)
async function setupCamera() {
    try {
        // Запрашиваем видео с камеры
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } // Задняя камера на телефоне
        });
        
        // Создаем HTML-элемент video для фона
        const video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', ''); // Важно для iOS
        video.play();
        
        // Настраиваем CSS, чтобы видео было на весь экран под 3D
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100vw';
        video.style.height = '100vh';
        video.style.objectFit = 'cover';
        video.style.zIndex = '-1'; // Позади 3D-сцены
        
        document.body.prepend(video);
        
        // Убираем градиентный фон, чтобы видеть камеру
        document.body.style.background = 'none';

    } catch (err) {
        console.warn("Камера недоступна или доступ запрещен. Оставляем градиентный фон.", err);
    }
}
setupCamera();

// 7. Загрузка моделей
const loader = new GLTFLoader();
let mannequinGroup = new THREE.Group(); 
scene.add(mannequinGroup);

let pantsModel = null;
const loadingText = document.getElementById('loading');
const controlsDiv = document.getElementById('controls');

// Загружаем Манекен
loader.load('./models/mannequin.glb', function (gltf) {
    const model = gltf.scene;
    
    // Центрируем
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.y -= box.min.y; // Ставим ноги на пол (Y=0)
    model.position.z -= center.z;
    
    // Вращаем манекен к нам лицом (если он стоит спиной)
    // model.rotation.y = Math.PI; 

    mannequinGroup.add(model);
    checkAllLoaded();
}, undefined, (error) => {
    console.error('Ошибка манекена:', error);
    loadingText.innerText = "Ошибка загрузки манекена";
    loadingText.style.color = "red";
});

// Загружаем Штаны
loader.load('./models/pants.glb', function (gltf) {
    pantsModel = gltf.scene;
    
    // ВАЖНО: Настройка положения штанов
    // Так как я не вижу точных размеров, эти цифры - предположение.
    // Вам нужно будет менять их, пока штаны не встанут на ноги.
    pantsModel.position.set(0, 0.5, 0); // X, Y (высота), Z
    pantsModel.scale.set(1, 1, 1);      // Масштаб
    
    pantsModel.visible = false;
    mannequinGroup.add(pantsModel);
    
    checkAllLoaded();
}, undefined, (error) => {
    console.error('Ошибка штанов:', error);
});

function checkAllLoaded() {
    if (mannequinGroup.children.length >= 1) {
        loadingText.style.display = 'none';
        controlsDiv.style.display = 'block';
    }
}

document.getElementById('btn-pants').addEventListener('click', () => {
    if (pantsModel) {
        pantsModel.visible = !pantsModel.visible;
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    renderer.render(scene, camera);
}
animate();
