const API_URL = "http://127.0.0.1:8000/recognize"; // 👉 adapte l'URL si ton API est déployée

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const captureBtn = document.getElementById("captureBtn");
const preview = document.getElementById("preview");
const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const result = document.getElementById("result");

// --- 1️⃣ Choisir une image depuis le PC ---
uploadBtn.addEventListener("click", async () => {
  if (!fileInput.files.length) {
    alert("Veuillez sélectionner une image");
    return;
  }
  const file = fileInput.files[0];
  preview.src = URL.createObjectURL(file);
  await recognizeFace(file);
});

// --- 2️⃣ Prendre une photo depuis la webcam ---
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    camera.srcObject = stream;
  } catch (err) {
    console.error("Erreur caméra:", err);
    alert("Impossible d'accéder à la webcam");
  }
}
startCamera();

captureBtn.addEventListener("click", async () => {
  const ctx = canvas.getContext("2d");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  ctx.drawImage(camera, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    preview.src = URL.createObjectURL(blob);
    await recognizeFace(blob);
  }, "image/jpeg");
});

// --- 3️⃣ Appel à l'API FastAPI ---
async function recognizeFace(fileOrBlob) {
  const formData = new FormData();
  formData.append("file", fileOrBlob);

  result.innerHTML = "⏳ Analyse en cours...";
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    if (!data.faces || data.faces.length === 0) {
      result.innerHTML = "Aucun visage détecté";
      return;
    }

    result.innerHTML = `✅ ${data.faces.length} visage(s) détecté(s)`;
    drawBoxes(data.faces);
  } catch (err) {
    console.error(err);
    result.innerHTML = "❌ Erreur : " + err.message;
  }
}

// --- 4️⃣ Dessiner les boîtes sur l'aperçu ---
function drawBoxes(faces) {
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 3;
  ctx.strokeStyle = "lime";
  ctx.font = "18px Arial";
  ctx.fillStyle = "lime";

  // On redessine l'image de prévisualisation dans le canvas
  const img = new Image();
  img.src = preview.src;
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    faces.forEach(face => {
      const { top, right, bottom, left } = face.box;
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.stroke();
      ctx.fillText(face.name, left + 6, top - 6);
    });
  };
}
