import { scaleToDPR } from '../graph/graphView.js';

const canvas = document.getElementById('graphView');

/**
 * Resizes the #graphView canvas to x and y parameters in an animation, beginning at a specified speed and slows
 * down until resized.
 * 
 * @param {Number} targetX the 'x' co-ordinate to resize to.
 * @param {Number} targetY the 'y' co-ordinate to resize to.
 * @returns true if successful and false if otherwise.
 */
 export function resizeAnim(targetX, targetY) {
    let canvasDoubleW = 0.0, canvasDoubleH = 0.0; // stores canvas dimensions in doubles to be more precise

    return new Promise(resolve => {
        let resize = () => {

            let changeX = (targetX - canvas.width) * .12;
            let changeY = (targetY - canvas.height) * .12;

            let DPRSpeed = .052, DPRSpeedX = targetX * DPRSpeed, DPRSpeedY = targetY * DPRSpeed;
            let lowestSpeed = .38;

            canvasDoubleW += (changeX > lowestSpeed) ? (changeX < DPRSpeedX) ? changeX : DPRSpeedX : lowestSpeed;
            canvasDoubleH += (changeY > lowestSpeed) ? (changeY < DPRSpeedY) ? changeY : DPRSpeedY : lowestSpeed;

            canvas.width = canvasDoubleW;
            canvas.height = canvasDoubleH;
            
            if (canvas.width < targetX || canvas.height < targetY) {
                requestAnimationFrame(resize);
            } else {
                resolve();
                scaleToDPR();
                return true;
            }
        }
        requestAnimationFrame(resize);
    });
}