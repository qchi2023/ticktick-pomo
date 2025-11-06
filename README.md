# TickTick Pomodoro GNOME Extension

This repository contains a GNOME Shell extension that adds a minimalist Pomodoro timer to the top panel.

## Features

- Start, pause, and reset controls directly in the panel
- A prominent countdown timer rendered alongside the controls
- Dynamic panel background colors that reflect focus, short break, and long break phases
- Automatic transition between focus sessions and breaks, including a long break every fourth cycle

## Installation

1. Copy the repository contents into your local extensions directory, renaming the folder to match the extension UUID:

   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions
   cp -r ticktick-pomo ~/.local/share/gnome-shell/extensions/ticktick-pomo@local
   ```

2. Restart GNOME Shell (press <kbd>Alt</kbd> + <kbd>F2</kbd>, enter `r`, and press <kbd>Enter</kbd> on Xorg; log out and back in on Wayland).

3. Enable the extension using GNOME Extensions app or `gnome-extensions enable ticktick-pomo@local`.

## Development

- Compatible with GNOME Shell versions 44 through 46
- Styles are defined in `stylesheet.css`; panel colors are applied via CSS classes on the panel actor
- Core functionality resides in `extension.js`
