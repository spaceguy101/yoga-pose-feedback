import React, { Component } from 'react';
import { render } from 'react-dom';
import * as posenet from '@tensorflow-models/posenet';

const MILLISECONDS = 500;
const maxVideoSize = 500;

export default class PoseNet extends Component {
    state = {
        poses: [],
    }

    componentDidMount = async () => {
        this.net = await posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            flipHorizontal: true
        });
        this.initCapture();
    }

    isMobile = () => {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        return isAndroid || isiOS;
    }

    loadVideo = async (videoElement) => {
        const video = await this.setupCamera(videoElement);
        video.play();
        return video;
    }

    setupCamera = async (videoElement) => {
        videoElement.width = maxVideoSize;
        videoElement.height = maxVideoSize;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const mobile = this.isMobile();
            const stream = await navigator.mediaDevices.getUserMedia({
                'audio': false,
                'video': {
                    facingMode: 'user',
                    width: mobile ? undefined : maxVideoSize,
                    height: mobile ? undefined : maxVideoSize
                }
            });
            videoElement.srcObject = stream;

            return new Promise(resolve => {
                videoElement.onloadedmetadata = () => {
                    resolve(videoElement);
                };
            });
        } else {
            return Promise.reject("");
        }
    }

    setRef = async (videoElement) => {
        this.videoElement = videoElement;
    }

    initCapture = () => {
        this.timeout = setTimeout(this.capture, MILLISECONDS);
    }

    capture = async () => {
        if (!this.videoElement || !this.net) {
            this.initCapture();
            return;
        }

        if (!this.video && this.videoElement) {
            this.video = await this.loadVideo(this.videoElement);
        }

        const allposes = await this.net
            .estimateMultiplePoses(this.video, {
                flipHorizontal: false,
                maxDetections: 1,
                scoreThreshold: 0.6,
                nmsRadius: 10
            })


        if (allposes.length > 0) {
            this.setState({ poses: allposes[0] });
        }
        if (this.props.onChange && allposes.length > 0) {
            this.props.onChange(allposes[0]);
        }
        this.initCapture();
    }

    render() {
        if (!this.props.children) {
            return null;
        }

        return (
            <div style={{ "display": "inline-block" }}>
                <video style={{ display: "block", "-webkit-transform": "scaleX(-1)", "transform": "scaleX(-1)" }} className="video" playsInline ref={this.setRef} />
                {this.props.children(this.state.poses)}
            </div>
        );
    }
}