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

// 1. Show the iPhone button only if on iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
    iphoneBtn.style.display = "block";
}

// 2. PiP Logic
iphoneBtn.addEventListener('click', async () => {
    try {
        if (document.pictureInPictureElement) {
            // If already in PiP, exit it
            await document.exitPictureInPicture();
            iphoneBtn.innerText = "iPhone Background Mode (PiP)";
        } else {
            // Start video and request PiP
            // alert("Swipe up from the bottom of the screen to enter Picture-in-Picture mode.");
            alert("Entering PiP mode'");
            await pipVideo.play();
            await pipVideo.requestPictureInPicture();
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

pipVideo.addEventListener('leavepictureinpicture', () => {
    statusText.innerText = "Status: INACTIVE";
    toggleBtn.className = "off";
    pipVideo.pause();
});