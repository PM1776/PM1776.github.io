import { clear, view, Point } from '../graph/graphView.js';
import { getDistance, getReciprocal } from '../general/utility.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext('2d');

/** The distance of the two mobile 'touch' points for determining whether zooming in or out. */
let zoomTouchDist = 0;

/**
 * A function that scales the {@link view} zoom scale to 1 instantly.
 */
function scale1Instantly () {

    clear();
    let zoomScale = view.getZoomScale();
    let pos = view.getPosition()
    let scaleRecip = getReciprocal(zoomScale);

    let targetX = pos.x;
    let targetY = pos.y;

    let at = {
        x: (-scaleRecip * pos.x + 1) / (targetX - (scaleRecip == 1) ? 2 : scaleRecip), 
        y: (-scaleRecip * pos.y + 1) / (targetY - (scaleRecip == 1) ? 2 : scaleRecip) 
    }

    view.scaleAt(at, scaleRecip);
    view.apply();
}

/**
 * Not working.
 * 
 * @param {*} to1 
 * @param {*} rate 
 * @param {*} overlaySpeed 
 * @returns 
 */
function scale1Anim (to1 = true, rate = .1, overlaySpeed = .1) {

    clear();

    let originalScale, scale;
    originalScale = scale = view.getZoomScale();
    rate = (scale > 1) ? 1 + rate : 1 - rate;
    let pos = view.getPosition();

    // gets the number of iterations
    let s, number;
    for (s = scale, number = 0; s != 1; number++, s /= rate) {
        if (rate < 1 && s > 1) s = 1;
        if (rate > 1 && s < 1) s = 1;
    }
    console.log(s + ", " + number);
    // //let a = { x: , y: };
    // let at = { x: canvas.width / 2 , y: canvas.height };

    return new Promise(resolve => {
        const scalingAnim = async () => {

            // slowly overlays the background layer on drawn objects to allow a trailing effect
            ctx.fillStyle = "rgb(255, 255, 255, " + overlaySpeed + ")";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // makes scale 1 if it exceeds it or gets smaller when dividing by the rate
            // scale = (rate > 1) ? (scale / rate )
            view.scaleAt(at, rate);
            view.apply();

            //if (scale )
        }
        requestAnimationFrame(scalingAnim);
    });
}

/**
 * Handles updating {@link view}'s zoom scale from either the desktop 'mousewheel' event or mobile 
 * 'touchmove' event containing two touch points.
 * 
 * @param {*} e A 'mousewheel' or 'touchmove' event containing two touch points.
 */
function updateZoomScale (e) {
    var e = window.event || e;
    var center, touchDelta;
    if (e.type === 'touchmove') {
        var touch1 = new Point(e.touches[0].clientX, e.touches[0].clientY);
        var touch2 = new Point(e.touches[1].clientX, e.touches[1].clientY);
        center = getDistanceHalfPoint(touch1, touch2);
        touchDelta = getDistance(touch1, touch2) - zoomTouchDist;
        zoomTouchDist = getDistance(touch1, touch2);
    }
    var x = (e.type != 'touchmove') ? e.offsetX : center.x;
    var y = (e.type != 'touchmove') ? e.offsetY : center.y;
    const delta = e.type === "mousewheel" ? e.wheelDelta : e.type !== "touchmove" ? -e.detail : touchDelta;
    if (delta > 0) { 
        view.scaleAt({x, y}, 1.1)
    } else { 
        view.scaleAt({x, y}, 1 / 1.1) 
    }
}

function getDistanceHalfPoint (v1, v2) {
    var halfDist = getDistance(v1, v2) / 2;
    var angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
    return {
        x: v2.x - halfDist * Math.cos(angle),
        y: v2.y - halfDist * Math.sin(angle)
    };
}

export { scale1Anim, scale1Instantly, getDistance, getDistanceHalfPoint, updateZoomScale };