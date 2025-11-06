/* exported init enable disable */

const { St, Clutter, GLib } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();

const PomodoroState = {
    IDLE: 'IDLE',
    FOCUS: 'FOCUS',
    SHORT_BREAK: 'SHORT_BREAK',
    LONG_BREAK: 'LONG_BREAK',
};

const PHASE_DURATIONS = {
    [PomodoroState.FOCUS]: 25 * 60,
    [PomodoroState.SHORT_BREAK]: 5 * 60,
    [PomodoroState.LONG_BREAK]: 15 * 60,
};

const PANEL_CLASSES = {
    [PomodoroState.FOCUS]: 'pomodoro-focus',
    [PomodoroState.SHORT_BREAK]: 'pomodoro-short-break',
    [PomodoroState.LONG_BREAK]: 'pomodoro-long-break',
};

class PomodoroIndicator extends PanelMenu.Button {
    constructor() {
        super(0.0, 'Pomodoro Indicator', false);

        this._buildLayout();
        this._resetState();
    }

    _buildLayout() {
        this._container = new St.BoxLayout({
            style_class: 'pomodoro-container',
            vertical: false,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.add_child(this._container);

        this._startButton = this._createButton('Start', () => this._onStart());
        this._pauseButton = this._createButton('Pause', () => this._onPause());
        this._resetButton = this._createButton('Reset', () => this._onReset());

        this._container.add_child(this._startButton);
        this._container.add_child(this._pauseButton);
        this._container.add_child(this._resetButton);

        this._spacer = new St.Widget({
            x_expand: true,
        });
        this._container.add_child(this._spacer);

        this._timerLabel = new St.Label({
            style_class: 'pomodoro-timer',
            x_align: Clutter.ActorAlign.END,
            text: '00:00',
        });
        this._timerLabel.set_x_expand(true);
        this._container.add_child(this._timerLabel);
    }

    _createButton(label, callback) {
        const button = new St.Button({
            label,
            style_class: 'pomodoro-button',
            x_align: Clutter.ActorAlign.START,
            can_focus: true,
        });
        button.connect('clicked', callback);
        return button;
    }

    _resetState() {
        this._currentState = PomodoroState.IDLE;
        this._remainingSeconds = PHASE_DURATIONS[PomodoroState.FOCUS];
        this._timerId = 0;
        this._focusSessionsCompleted = 0;
        this._paused = false;
        this._updateTimerLabel();
        this._syncPanelStyle();
    }

    _onStart() {
        if (this._timerId) {
            return;
        }

        if (this._currentState === PomodoroState.IDLE) {
            this._beginPhase(PomodoroState.FOCUS);
            return;
        }

        if (this._paused && this._remainingSeconds > 0) {
            this._paused = false;
            this._startTicker();
        }
    }

    _onPause() {
        if (!this._timerId || this._paused) {
            return;
        }

        GLib.source_remove(this._timerId);
        this._timerId = 0;
        this._paused = true;
    }

    _onReset() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }

        this._resetState();
    }

    _startTicker() {
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._remainingSeconds = Math.max(0, this._remainingSeconds - 1);
            this._updateTimerLabel();

            if (this._remainingSeconds <= 0) {
                this._completePhase();
                return GLib.SOURCE_REMOVE;
            }

            return GLib.SOURCE_CONTINUE;
        });
    }

    _beginPhase(phase) {
        this._currentState = phase;
        this._remainingSeconds = PHASE_DURATIONS[phase] ?? 0;
        this._paused = false;
        this._updateTimerLabel();
        this._syncPanelStyle();

        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }

        if (this._remainingSeconds > 0) {
            this._startTicker();
        } else {
            this._completePhase();
        }
    }

    _completePhase() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }

        if (this._currentState === PomodoroState.FOCUS) {
            this._focusSessionsCompleted += 1;
            if (this._focusSessionsCompleted % 4 === 0) {
                this._beginPhase(PomodoroState.LONG_BREAK);
            } else {
                this._beginPhase(PomodoroState.SHORT_BREAK);
            }
            return;
        }

        if (
            this._currentState === PomodoroState.SHORT_BREAK ||
            this._currentState === PomodoroState.LONG_BREAK
        ) {
            this._beginPhase(PomodoroState.FOCUS);
            return;
        }

        this._resetState();
    }

    _updateTimerLabel() {
        const minutes = Math.floor(this._remainingSeconds / 60);
        const seconds = this._remainingSeconds % 60;
        this._timerLabel.text = `${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
    }

    _syncPanelStyle() {
        this._clearPanelClasses();

        const styleClass = PANEL_CLASSES[this._currentState];
        if (styleClass) {
            Main.panel.add_style_class_name(styleClass);
        }
    }

    _clearPanelClasses() {
        for (const styleClass of Object.values(PANEL_CLASSES)) {
            Main.panel.remove_style_class_name(styleClass);
        }
    }

    destroy() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }
        this._clearPanelClasses();
        super.destroy();
    }
}

class Extension {
    constructor() {
        this._indicator = null;
        this._cssProvider = null;
        this._themeContext = null;
    }

    enable() {
        if (this._indicator) {
            return;
        }

        this._loadStylesheet();
        this._indicator = new PomodoroIndicator();
        Main.panel.addToStatusArea('ticktick-pomodoro', this._indicator);
    }

    disable() {
        if (!this._indicator) {
            this._unloadStylesheet();
            return;
        }

        this._indicator.destroy();
        this._indicator = null;
        this._unloadStylesheet();
    }

    _loadStylesheet() {
        if (this._cssProvider) {
            return;
        }

        this._themeContext = St.ThemeContext.get_for_stage(global.stage);
        this._cssProvider = new St.CssProvider();
        this._cssProvider.load_from_path(Me.dir.get_child('stylesheet.css').get_path());
        this._themeContext.add_provider(this._cssProvider, St.ThemePriority.APPLICATION);
    }

    _unloadStylesheet() {
        if (!this._cssProvider || !this._themeContext) {
            this._cssProvider = null;
            this._themeContext = null;
            return;
        }

        this._themeContext.remove_provider(this._cssProvider);
        this._cssProvider = null;
        this._themeContext = null;
    }
}

function init() {
    return new Extension();
}
