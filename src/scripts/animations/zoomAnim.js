import { clear, view, getReciprocal } from '../graph/graphView.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext('2d');

/**
 * A function that scales the view to 1 instantly with no parameters, or, if provided the scale and position,
 * will scale to those instantly.
 * 
 * @param {*} scale the number to 
 * @param {*} pos 
 */
function scale1Instantly (scale = view.getScale(), pos = view.getPosition()) {

    clear();
    let scaleRecip = getReciprocal(scale) 

    let targetX = (scale != view.getScale()) ? pos.x : 1;
    let targetY = (scale != view.getScale()) ? pos.y : 1;

    let at = {
        x: (-scaleRecip * pos.x + 1) / (targetX - (scaleRecip == 1) ? 2 : scaleRecip), // doesn't work with 
        y: (-scaleRecip * pos.y + 1) / (targetY - (scaleRecip == 1) ? 2 : scaleRecip)  // scaleRecip as 1
    }

    // TODO: work on changing view to any scale and position

    view.scaleAt(at, scaleRecip);
    view.apply();
}

function scale1Anim (to1 = true, rate = .1, overlaySpeed = .1) {

    clear();

    let originalScale, scale;
    originalScale = scale = view.getScale();
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

export { scale1Anim, scale1Instantly };