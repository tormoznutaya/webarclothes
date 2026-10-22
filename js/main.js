import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

const container = document.getElementById('canvas-container');
const loadingText = document.getElementById('loading');
const controlsDiv = document.getElementById('controls');

// 1. Сцена и Камера
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 3);

// 2. Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true; // Включаем WebXR
container.appendChild(renderer.domElement);

// 3. Свет
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// 4. Управление для обычного режима (на ПК)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// 5. Группа для манекена
let mannequinGroup = new THREE.Group();
scene.add(mannequinGroup);

// ВАЖНО: Изначально прячем манекен, пока не тапнем по полу
mannequinGroup.visible = false;

let pantsModel = null;
const loader = new GLTFLoader();

// Загружаем Манекен
loader.load('./models/mannequin.glb', function (gltf) {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y; 
    model.position.x -= (box.max.x + box.min.x) / 2;
    model.position.z -= (box.max.z + box.min.z) / 2;

    mannequinGroup.add(model);
    checkAllLoaded();
});

// Загружаем Штаны
loader.load('./models/pants.glb', function (gltf) {
    pantsModel = gltf.scene;
    // Спускаем штаны пониже (можете подправить число 0.6)
    pantsModel.position.set(0, 0.6, 0); 
    pantsModel.visible = false;
    mannequinGroup.add(pantsModel);
    checkAllLoaded();
});

function checkAllLoaded() {
    if (mannequinGroup.children.length >= 2) {
        loadingText.style.display = 'none';
        controlsDiv.style.display = 'block';
    }
}

document.getElementById('btn-pants').addEventListener('click', () => {
    if (pantsModel) pantsModel.visible = !pantsModel.visible;
});

// --- НАСТРОЙКА AR (Дополненной реальности) ---
const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
document.body.appendChild(arButton);

let hitTestSource = null;
let hitTestSourceRequested = false;
let reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.07, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }) // Зеленый прицел
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

// Логика при запуске AR-сессии
renderer.xr.addEventListener('sessionstart', async () => {
    const session = renderer.xr.getSession();
    // Запрашиваем данные о поверхностях (пол, стол)
    const viewerSpace = await session.requestReferenceSpace('viewer');
    const hitTestSourceRequest = await session.requestHitTestSource({ space: viewerSpace });
    hitTestSource = hitTestSourceRequest;

    // При тапе по экрану ставим манекен на пол
    session.addEventListener('select', () => {
        if (reticle.visible) {
            // Переносим манекен туда, где прицел
            mannequinGroup.position.setFromMatrixPosition(reticle.matrix);
            mannequinGroup.visible = true;
        }
    });
});

renderer.xr.addEventListener('sessionend', () => {
    hitTestSourceRequested = false;
    hitTestSource = null;
    hitTestSourceRequested = false;
    mannequinGroup.visible = false; // При выходе из AR снова прячем
});

// Цикл отрисовки
renderer.setAnimationLoop(function (timestamp, frame) {
    if (frame) {
        // Если мы в AR-режиме
        if (hitTestSource && !mannequinGroup.visible) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        } else if (mannequinGroup.visible) {
            reticle.visible = false; // Если манекен уже стоит, прицел убираем
        }
    } else {
        // Если мы на ПК
        controls.update();
        mannequinGroup.visible = true; // На ПК показываем сразу
    }
    
    renderer.render(scene, camera);
});
