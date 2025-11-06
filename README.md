# TickTick Pomodoro GNOME Extension

This repository contains a GNOME Shell extension that adds a minimalist Pomodoro timer to the top panel.

## Features

- Start, pause, and reset controls directly in the panel
- A prominent countdown timer rendered alongside the controls
- Dynamic panel background colors that reflect focus, short break, and long break phases
- Automatic transition between focus sessions and breaks, including a long break every fourth cycle

## Installation

### 1. Download the code

Clone the repository or download the latest archive:

```bash
git clone https://github.com/qchi2023/ticktick-pomo.git
# or download the ZIP from the GitHub web interface and extract it
```

### 2. Copy it into the GNOME extensions directory

Rename the folder so it matches the extension UUID defined in `metadata.json` (`ticktick-pomo@local`) and place it under `~/.local/share/gnome-shell/extensions`:

```bash
cd ticktick-pomo
EXT_DIR=~/.local/share/gnome-shell/extensions/ticktick-pomo@local
mkdir -p "$(dirname "$EXT_DIR")"
cp -r . "$EXT_DIR"
```

If you downloaded a ZIP, extract it and copy the extracted files into the same location instead.

### 3. Restart GNOME Shell

Press <kbd>Alt</kbd> + <kbd>F2</kbd>, enter `r`, and press <kbd>Enter</kbd> when running on Xorg. On Wayland, log out and back in to reload the shell.

### 4. Enable the extension

Use the GNOME Extensions app or run:

```bash
gnome-extensions enable ticktick-pomo@local
```

## Development

- Compatible with GNOME Shell versions 44 through 46
- Styles are defined in `stylesheet.css`; panel colors are applied via CSS classes on the panel actor
- Core functionality resides in `extension.js`
