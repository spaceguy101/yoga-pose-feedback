import React, { Component } from "react";
import { Player, ControlBar } from "video-react";
import "video-react/dist/video-react.css";
import "./App.css";
import PoseNet from "./components/posenet";
import {
  getAvgConfidence,
  getPoseVector,
  roundnum,
  cosineDistanceMatching,
} from "./utils";
import inputVideoPoses from "./input.json";

const FPS = 2;
const frameInterval = 1000 / FPS;
const SIMILARITY_THRESHOLD_EXCELLENT = 0.15;
const SIMILARITY_THRESHOLD_GOOD = 0.35;
const SIMILARITY_THRESHOLD_OKAY = 0.7;

export default class PlayerControlExample extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      score: 0,
      pose: null,
      currentTime: 0,
    };
  }

  componentDidMount() {
    // subscribe state change
    this.isMobile =
      /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.interval = setInterval(() => this.findSimilarity(this.state), 200);
    this.player.subscribeToStateChange(this.handleStateChange.bind(this));
    this.onPose = this.handlePoseChange.bind(this);
  }

  findSimilarity({ pose, currentTime }) {
    if (currentTime && pose) {
      var avgConfidence = getAvgConfidence(pose.keypoints);

      if (avgConfidence > 0.4) {
        var nearestTime = roundnum(frameInterval, currentTime * 1000);
        var poseFromInputVideo =
          inputVideoPoses[(nearestTime / frameInterval).toString()];

        var remark = "";
        if (poseFromInputVideo) {
          var score = cosineDistanceMatching(
            getPoseVector(pose),
            poseFromInputVideo
          ).toFixed(2);

          if (score < SIMILARITY_THRESHOLD_EXCELLENT) {
            remark = `Very Good - ${score}`;
          } else if (score < SIMILARITY_THRESHOLD_GOOD) {
            remark = `Good - ${score}`;
          } else if (score < SIMILARITY_THRESHOLD_OKAY) {
            remark = `Bad - ${score}`;
          } else {
            remark = `Very Bad - ${score}`;
          }
        } else {
          remark = "Waiting For Instructor";
        }
      } else {
        remark = "Please Stand in Front of Camera with Whole body visible";
      }

      this.setState({ status: remark });
    } else {
      this.setState({
        status: "Please Stand in Front of Camera with Whole body visible",
      });
    }
  }

  handlePoseChange(pose) {
    this.setState({ pose });
  }

  handleStateChange(state) {
    // copy player state to this component's state
    this.setState({
      player: state,
    });
    if (this.state.player) {
      this.setState({ currentTime: this.state.player.currentTime });
      //this.state.currentTime = this.state.player.currentTime
      //console.log(this.state.player.currentTime)
    }
  }

  render() {
    return (
      <div>
        {this.isMobile ? (
          <div className="flex-container">
            <div className="status">Please Visit this Page On a Desktop</div>
          </div>
        ) : (
          <div>
            <header className="header">
              <a href="" className="logo">
                <span className="logo-name"> Yoga Pose Feedback</span>
              </a>
            </header>

            <div className="flex-container">
              <div className="player-container">
                <div className="video-header">Your Instructor 👇</div>
                <Player
                  fluid={false}
                  width={640}
                  height={360}
                  ref={(player) => {
                    this.player = player;
                  }}
                  autoPlay
                >
                  <source src="input.mp4" />
                  <ControlBar autoHide={false} />
                </Player>
              </div>
              <div className="camera-container">
                <div className="video-header">You 👇</div>
                <PoseNet onChange={this.onPose}>
                  {(poses) => <div></div>}
                </PoseNet>
              </div>
            </div>
            <div className="status">{this.state.status}</div>
            <div className="comment">
              The score is based on how well you copy the Instructor's pose
            </div>
          </div>
        )}
      </div>
    );
  }
}
