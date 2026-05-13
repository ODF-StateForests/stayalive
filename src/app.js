let wakeLock = null;
let timerTimeout = null;

const toggleBtn = document.getElementById('toggleBtn');
const compactBtn = document.getElementById('compactBtn');
const statusText = document.getElementById('status-text');
const maxTimeInput = document.getElementById('maxTime');
const card = document.querySelector('.card');

// Function to request the Wake Lock
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        
        statusText.innerText = "Screen Lock: ACTIVE";
        toggleBtn.innerText = "Disable StayAwake";
        toggleBtn.className = "on";

        // Handle auto-release (e.g., if user minimizes the tab)
        wakeLock.addEventListener('release', () => {
            if (wakeLock !== null) {
                console.log('Wake Lock was released');
            }
        });

        // Optional Timer logic
        const minutes = parseInt(maxTimeInput.value);
        if (minutes > 0) {
            timerTimeout = setTimeout(() => {
                releaseWakeLock();
                alert('StayAwake: Maximum time reached.');
            }, minutes * 60000);
        }

    } catch (err) {
        statusText.innerText = `Error: ${err.message}`;
    }
}

// Function to release the Wake Lock
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
    if (timerTimeout) clearTimeout(timerTimeout);
    
    statusText.innerText = "Screen Lock: INACTIVE";
    toggleBtn.innerText = "Enable StayAwake";
    toggleBtn.className = "off";
}

toggleBtn.addEventListener('click', () => {
    if (wakeLock === null) {
        requestWakeLock();
    } else {
        releaseWakeLock();
    }
});

compactBtn.addEventListener('click', () => {
    document.body.classList.toggle('compact');
    compactBtn.innerText = document.body.classList.contains('compact') 
        ? "Exit Compact" 
        : "Toggle Compact Mode";
});

// CRITICAL: Ensure the lock re-activates when the user interacts 
// with the split-screen window.
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
        console.log("Wake Lock re-acquired in split view.");
    }
});

// iOS PiP Logic
const pipVideo = document.getElementById('pipVideo');
const iphoneBtn = document.getElementById('iphoneBtn');

const supportsStandardPiP = 'requestPictureInPicture' in HTMLVideoElement.prototype;
const supportsWebkitPiP = 'webkitSetPresentationMode' in HTMLVideoElement.prototype;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const pipAvailable = isIOS && (supportsStandardPiP || supportsWebkitPiP);

if (pipAvailable) {
    iphoneBtn.style.display = "block";
}

// 2. PiP Logic
iphoneBtn.addEventListener('click', async () => {
    try {
        const alreadyInPiP = document.pictureInPictureElement || pipVideo.webkitPresentationMode === 'picture-in-picture';

        if (alreadyInPiP) {
            if (document.exitPictureInPicture) {
                await document.exitPictureInPicture();
            } else if (supportsWebkitPiP) {
                pipVideo.webkitSetPresentationMode('inline');
            }
            iphoneBtn.innerText = "iPhone Background Mode (PiP)";
        } else {
            alert("Swipe up from the bottom of the screen to enter Picture-in-Picture mode.");
            await pipVideo.play();

            if (supportsStandardPiP) {
                await pipVideo.requestPictureInPicture();
            } else if (supportsWebkitPiP) {
                pipVideo.webkitSetPresentationMode('picture-in-picture');
            } else {
                throw new Error('Picture-in-Picture is unsupported in this browser.');
            }

            iphoneBtn.innerText = "Disable PiP Mode";
        }
    } catch (error) {
        console.error("PiP failed:", error);
        alert("To keep iPhone awake in background, please allow Picture-in-Picture.");
    }
});

// 3. Keep the "StayAwake" status synced
pipVideo.addEventListener('enterpictureinpicture', () => {
    statusText.innerText = "Status: PIP ACTIVE (Background OK)";
    toggleBtn.className = "on";
});

pipVideo.addEventListener('webkitpresentationmodechanged', () => {
    if (pipVideo.webkitPresentationMode === 'picture-in-picture') {
        statusText.innerText = "Status: PIP ACTIVE (Background OK)";
        toggleBtn.className = "on";
        iphoneBtn.innerText = "Disable PiP Mode";
    } else {
        statusText.innerText = "Status: INACTIVE";
        toggleBtn.className = "off";
        iphoneBtn.innerText = "iPhone Background Mode (PiP)";
        pipVideo.pause();
    }
});

pipVideo.addEventListener('leavepictureinpicture', () => {
    statusText.innerText = "Status: INACTIVE";
    toggleBtn.className = "off";
    pipVideo.pause();
});