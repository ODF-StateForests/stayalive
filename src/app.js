let wakeLock = null;
let timerTimeout = null;

const toggleBtn = document.getElementById('toggleBtn');
const statusText = document.getElementById('status-text');
const maxTimeInput = document.getElementById('maxTime');
const collapseBtn = document.getElementById('collapseBtn');
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

const compactBtn = document.getElementById('compactBtn');

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

// Collapse/Expand functionality
collapseBtn.addEventListener('click', () => {
    card.classList.toggle('collapsed');
    collapseBtn.innerText = card.classList.contains('collapsed') ? '+' : '−';
    localStorage.setItem('collapsed', card.classList.contains('collapsed'));
});

// Load collapsed state on page load
if (localStorage.getItem('collapsed') === 'true') {
    card.classList.add('collapsed');
    collapseBtn.innerText = '+';
}