const { StrictMode, Component, createRef } = React;

class Controls extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div className="controls-container">{this.props.children}</div>;
  }
}

class TimerSetter extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="timer-setter">
        <h2 className="label" id={`${this.props.el}-label`}>
          {this.props.label}
        </h2>
        <Controls>
          <button
            className="btn"
            id={`${this.props.el}-decrement`}
            data-el={this.props.el}
            onClick={this.props.onMinusClick}
          >
            <i className="fa fa-arrow-down"></i>
          </button>
          <span className="timer-setter-minutes" id={`${this.props.el}-length`}>
            {this.props.length}
          </span>
          <button
            className="btn"
            id={`${this.props.el}-increment`}
            data-el={this.props.el}
            onClick={this.props.onPlusClick}
          >
            <i className="fa fa-arrow-up"></i>
          </button>
        </Controls>
      </div>
    );
  }
}

class Timer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="timer-container">
        <div
          className={`timer-display ${this.props.displayedTime.startsWith("00") && "warn"}`}
        >
          <h2 className="label" id="timer-label">
            {this.props.timerType}
          </h2>
          <div className="timer" id="time-left">
            {this.props.displayedTime}
          </div>
        </div>
        <Controls>
          <button
            className="btn"
            id="start_stop"
            onClick={this.props.onPlayPauseCLick}
          >
            <i className="fa fa-play"></i>
            <i className="fa fa-pause"></i>
          </button>
          <button className="btn" id="reset" onClick={this.props.onResetClick}>
            <i className="fa fa-refresh"></i>
          </button>
        </Controls>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      length: {
        break: 5,
        session: 25,
      },
      timerType: "Session",
      timerDisplay: null,
      isTimerPaused: false,
      inTransition: false,
    };

    this.getFormattedTime = this.getFormattedTime.bind(this);
    this.switchTimerAfterDelay = this.switchTimerAfterDelay.bind(this);
    this.decrementLength = this.decrementLength.bind(this);
    this.incrementLength = this.incrementLength.bind(this);
    this.handlePlayPause = this.handlePlayPause.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.playTimer = this.playTimer.bind(this);

    this.timer = new easytimer.Timer({ countdown: true });
    this.audioRef = createRef(null);
    this.delayTimer = null;
  }

  getFormattedTime(time) {
    return time < 10 ? "0" + time : time;
  }

  switchTimerAfterDelay() {
    this.setState({ ...this.state, inTransition: true });

    //delay to display timer label and starting point correctly
    if (this.delayTimer) clearTimeout(this.delayTimer);
    this.delayTimer = setTimeout(() => {
      this.setState({
        ...this.state,
        timerType: this.state.timerType === "Session" ? "Break" : "Session",
        timerDisplay: null,
        inTransition: false,
      });

      //restart timer
      this.playTimer();
    }, 1000);
  }

  decrementLength(e) {
    const el = e.currentTarget.dataset.el;
    const currMinutes = this.state.length[el];

    //no action if currMinutes is 1 or timer is not paused
    if (this.timer.isRunning() || currMinutes === 1) return;

    //decrease minutes by 1 and change timerDisplay if timerType===el
    if (this.state.timerType.toLowerCase() === el) {
      this.setState((p) => {
        return {
          ...p,
          isTimerPaused: false,
          timerDisplay: null,
        };
      });
    }

    this.setState((p) => {
      return {
        ...p,
        length: { ...p.length, [el]: p.length[el] - 1 },
      };
    });
  }

  incrementLength(e) {
    const el = e.currentTarget.dataset.el;
    const currMinutes = this.state.length[el];

    //no action if currMinutes is 60 or timer is not paused
    if (this.timer.isRunning() || currMinutes === 60) return;

    //increase minutes by 1 and change timerDisplay if timerType===el
    if (this.state.timerType.toLowerCase() === el) {
      this.setState((p) => {
        return {
          ...p,
          isTimerPaused: false,
          timerDisplay: null,
        };
      });
    }

    this.setState((p) => {
      return {
        ...p,
        length: { ...p.length, [el]: p.length[el] + 1 },
      };
    });
  }

  playTimer() {
    this.setState({ ...this.state, isTimerPaused: false });

    //if timer is paused resume the current Timer
    if (this.state.isTimerPaused) {
      //if timer is at end begin transition
      if (this.timer.getTimeValues().toString() === "00:00:00") {
        this.switchTimerAfterDelay();
        return;
      }

      this.timer.start();
      return;
    }

    this.timer.stop(); //to prevent timer to resume
    this.timer.start({
      startValues: {
        minutes: this.state.length[this.state.timerType.toLowerCase()],
      },
    });
  }

  handlePlayPause() {
    //if timer is in transition stop the transition
    if (this.state.inTransition) {
      if (this.delayTimer) clearTimeout(this.delayTimer);
      this.setState({
        ...this.state,
        isTimerPaused: true,
        inTransition: false,
      });
      return;
    }

    //if timer is running then pause it
    if (this.timer.isRunning()) {
      this.timer.pause();
      this.setState({ ...this.state, isTimerPaused: true });
      return;
    }

    this.playTimer();
  }

  handleReset() {
    //rewound alarm
    this.audioRef.current.pause();
    this.audioRef.current.currentTime = 0;

    //clear delayTimer if set
    if (this.delayTimer) clearTimeout(this.delayTimer);

    //stop the timer and reset default state values
    this.timer.stop();
    this.setState({
      length: {
        break: 5,
        session: 25,
      },
      timerType: "Session",
      timerDisplay: null,
      isTimerPaused: false,
      inTransition: false,
    });
  }

  componentDidMount() {
    this.timer.addEventListener("targetAchieved", () => {
      //play alarm
      this.audioRef.current.play();

      //begin traansition
      this.switchTimerAfterDelay();
    });

    this.timer.addEventListener("secondsUpdated", () => {
      //display current timer
      this.setState({
        ...this.state,
        timerDisplay: this.timer
          .getTimeValues()
          .toString(["minutes", "seconds"]),
      });
    });
  }

  componentWillUnmount() {
    this.timer.removeAllEventListeners();
  }

  render() {
    const displayedTime =
      this.state.timerDisplay ||
      `${this.getFormattedTime(this.state.length[this.state.timerType.toLowerCase()])}:00`;

    return (
      <>
        <h1 className="heading">25 + 5 Clock</h1>
        <div className="app-body">
          <div className="timer-setter-container">
            <TimerSetter
              el="break"
              label="Break Length"
              length={this.state.length.break}
              onMinusClick={(e) => this.decrementLength(e)}
              onPlusClick={(e) => this.incrementLength(e)}
            />
            <TimerSetter
              el="session"
              label="Session Length"
              length={this.state.length.session}
              onMinusClick={(e) => this.decrementLength(e)}
              onPlusClick={(e) => this.incrementLength(e)}
            />
          </div>
          <Timer
            timerType={this.state.timerType}
            displayedTime={displayedTime}
            onPlayPauseCLick={(e) => this.handlePlayPause(e)}
            onResetClick={(e) => this.handleReset(e)}
          />
          <audio
            id="beep"
            src="https://cdn.freecodecamp.org/testable-projects-fcc/audio/BeepSound.wav"
            ref={this.audioRef}
          ></audio>
        </div>
      </>
    );
  }
}

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root"),
);
