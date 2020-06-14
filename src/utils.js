import similarity from 'compute-cosine-similarity';

var WIDTH = 1280;
var HEIGHT = 720;

export const getPoseVector = (pose) => {
    let xPos = pose.keypoints.map(k => {
        let x = k.position.x
        if (x > WIDTH) {
            x = WIDTH
        } else if (x < 0) {
            x = 0.00001
        }
        return x
    });
    let yPos = pose.keypoints.map((k) => {

        let y = k.position.y
        if (y > HEIGHT) {
            y = HEIGHT
        } else if (y < 0) {
            y = 0.00001
        }
        return y

    });

    let minX = Math.min(...xPos);
    let minY = Math.min(...yPos);

    const vector = [];
    for (let i = 0; i < xPos.length; i++) {
        let x = xPos[i] - minX
        let y = yPos[i] - minY
        let length = Math.sqrt(x * x + y * y);
        x = Number.isNaN(x / length) ? 0.00001 : x / length
        y = Number.isNaN(y / length) ? 0.00001 : y / length

        vector.push(x)
        vector.push(y)
    }
    return vector;

}

export const poseSimilarity = (pose1, pose2) => {
    const poseVector1 = getPoseVector(pose1);
    const poseVector2 = getPoseVector(pose2);
    return cosineDistanceMatching(poseVector1, poseVector2);
};


// Cosine similarity as a distance function. The lower the number, the closer // the match
// poseVector1 and poseVector2 are a L2 normalized 34-float vectors (17 keypoints each
// with an x and y. 17 * 2 = 32)
export function cosineDistanceMatching(poseVector1, poseVector2) {
    const cosineSimilarity = similarity(poseVector1, poseVector2);
    const distance = 2 * (1 - cosineSimilarity);
    return Math.sqrt(distance);
}


// poseVector1 and poseVector2 are 52-float vectors composed of:
// Values 0-33: are x,y coordinates for 17 body parts in alphabetical order
// Values 34-51: are confidence values for each of the 17 body parts in alphabetical order
// Value 51: A sum of all the confidence values
// Again the lower the number, the closer the distance
function weightedDistanceMatching(poseVector1, poseVector2) {
    const vector1PoseXY = poseVector1.slice(0, 34);
    const vector1Confidences = poseVector1.slice(34, 51);
    const vector1ConfidenceSum = poseVector1.slice(51, 52);

    const vector2PoseXY = poseVector2.slice(0, 34);

    // First summation
    const summation1 = 1 / vector1ConfidenceSum;

    // Second summation
    let summation2 = 0;
    for (let i = 0; i < vector1PoseXY.length; i++) {
        const tempConf = Math.floor(i / 2);
        const tempSum = vector1Confidences[tempConf] * Math.abs(vector1PoseXY[i] - vector2PoseXY[i]);
        summation2 += tempSum;
    }

    return summation1 * summation2;
}

export function roundnum(frameInterval, num) { return Math.round(num / frameInterval) * frameInterval; }

export function getAvgConfidence(keypoints) {

    var total = 0;
    for (var i = 0; i < keypoints.length; i++) {
        total += keypoints[i].score;
    }
    return total / keypoints.length;

}