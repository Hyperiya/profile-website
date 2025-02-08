const track = document.querySelector(".image-track");
const images = track.getElementsByTagName("img");
// Profile

// IMAGE TRACK
// Initiate Variables
track.dataset.mouseDownAt = "0";
track.dataset.prevPercentage = "50";
track.dataset.percentage = "0";

track.style.transform = "translate(50%, 0%)";
// Also set initial object position for images
for(const image of images) {
    image.style.objectPosition = "75% center";
}

window.onmousedown = e => {
    track.dataset.mouseDownAt = e.clientX;
    track.setAttribute('data-dragging', 'true');
}

window.onmouseup = () => {
    track.dataset.mouseDownAt = "0";
    track.dataset.prevPercentage = track.dataset.percentage;
    track.setAttribute('data-dragging', 'false');  
}

// Add this function to recalculate dimensions
function updateTrackDimensions() {
    // Reset the track position
    track.dataset.prevPercentage = "50";
    track.dataset.percentage = "0";
    track.style.transform = "translate(50%, 0%)";
    
    // Reset image positions
    for(const image of images) {
        image.style.objectPosition = "75% center";
    }
}

// Add resize listener
window.addEventListener('resize', updateTrackDimensions);


window.onmousemove = e => {
    if(track.dataset.mouseDownAt === "0") return;

    

    const mouseDelta = parseFloat(track.dataset.mouseDownAt) - e.clientX;
    const maxDelta = window.innerWidth/2;

    const percentage = (mouseDelta / maxDelta) * -100;
    const nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage) + percentage;

    const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 50), -75);

    track.dataset.percentage = nextPercentage;

    // Move the track
    track.animate({
        transform: `translate(${nextPercentage}%, 0%)`
    }, { duration: 1200, fill: "forwards" });

    // Calculate parallax position from center (50%)
    const parallaxPosition = `${50 + (nextPercentage / 2)}% center`;
    
    // Apply the same parallax position to all images
    for(const image of images) {
        image.animate({
            objectPosition: parallaxPosition
        }, { duration: 1200, fill: "forwards" });
    }
}

window.ontouchstart = e => {
    track.dataset.mouseDownAt = e.touches[0].clientX;
}

window.ontouchend = () => {
    track.dataset.mouseDownAt = "0";
    track.dataset.prevPercentage = track.dataset.percentage;
}

window.ontouchmove = e => {
    if(track.dataset.mouseDownAt === "0") return;

    const touchDelta = parseFloat(track.dataset.mouseDownAt) - e.touches[0].clientX;
    const maxDelta = window.innerWidth / 2;

    const percentage = (touchDelta / maxDelta) * -100;
    const nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage) + percentage;
    const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 50), -100);

    track.dataset.percentage = nextPercentage;

    track.animate({
        transform: `translate(${nextPercentage}%, 0%)`
    }, { duration: 1200, fill: "forwards" });

    // Calculate parallax position from center (50%)
    const parallaxPosition = `${50 + (nextPercentage / 2)}% center`;
    
    for(const image of images) {
        image.animate({
            objectPosition: parallaxPosition
        }, { duration: 1200, fill: "forwards" });
    }
}

// Prevent default drag behavior
track.ondragstart = e => {
    e.preventDefault();
}

// Cursor styling
track.addEventListener("mousedown", () => {
    track.style.cursor = "default";
});

track.addEventListener("mouseup", () => {
    track.style.cursor = "default";
});

// Prevent default touch moves
document.addEventListener('touchmove', function(e) {
  e.preventDefault();
}, { passive: false });

// Prevent scrolling with keyboard
document.addEventListener('keydown', function(e) {
    // Define keys to prevent
    const preventedKeys = [
        ' ',                // Space
        'PageUp',          // Page Up
        'PageDown',        // Page Down
        'End',             // End
        'Home',            // Home
        'ArrowLeft',       // Left
        'ArrowUp',         // Up
        'ArrowRight',      // Right
        'ArrowDown'        // Down
    ];
    
    if (preventedKeys.includes(e.key)) {
        e.preventDefault();
        return false;
    }
});


// Prevent mouse wheel scrolling
document.addEventListener('wheel', function(e) {
  e.preventDefault();
}, { passive: false });
