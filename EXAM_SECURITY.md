# Exam Lockdown & Proctoring Features

## Overview
The School Assessment & Examination System now includes comprehensive proctoring features to prevent cheating during online exams.

## Security Features Implemented

### 1. **Fullscreen Enforcement**
- Exams automatically enter fullscreen mode when started
- Students cannot exit fullscreen using the ESC key (blocked)
- If fullscreen is somehow exited, the system:
  - Logs it as a violation
  - Shows a warning
  - Automatically re-enters fullscreen after 100ms

### 2. **Tab Switching Detection**
- Monitors when students switch to another tab or window
- Detects when the browser loses focus
- Each tab switch is counted as a violation

### 3. **Violation Tracking System**
- Maximum 3 violations allowed per exam
- Violations are tracked for:
  - Tab switching
  - Window blur (losing focus)
  - Exiting fullscreen
- After 3 violations: **Exam is automatically submitted**

### 4. **Keyboard Shortcut Prevention**
The following keyboard shortcuts are blocked during exams:

#### Developer Tools
- `F12` - Developer console
- `Ctrl + Shift + I` - Inspect element
- `Ctrl + Shift + J` - Console
- `Ctrl + Shift + C` - Element picker
- `Ctrl + U` - View source

#### Window/Tab Management
- `ESC` - Exit fullscreen
- `Ctrl + W` - Close tab
- `Ctrl + T` - New tab
- `Ctrl + N` - New window
- `Alt + Tab` - Switch windows
- `Alt + F4` - Close window

### 5. **Right-Click Prevention**
- Context menu is disabled during exams
- Prevents copying, inspecting elements, etc.

### 6. **Visual Indicators**
- **"PROCTORED MODE" badge** - Displayed in the exam header
- **Violation warning banner** - Red animated banner shows when violations occur
- **Violation counter** - Shows "Violations: X/3"

## How It Works

### When Student Starts Exam:
1. System enters fullscreen mode automatically
2. Lockdown features activate
3. "PROCTORED MODE" badge appears
4. All keyboard shortcuts are blocked

### When Violation Occurs:
1. Violation counter increments
2. Red warning banner appears for 5 seconds
3. Toast notification shows the specific violation
4. Activity is logged

### After 3 Violations:
1. Exam is automatically submitted
2. Student receives notification
3. Results are saved with current answers

## Limitations

⚠️ **Important Notes:**
- Web browsers cannot physically block the operating system from opening other applications
- Students can still use their phone or another device (requires physical monitoring)
- This is a "Soft Lockdown" - it deters and detects cheating but cannot prevent all methods
- For maximum security, combine with:
  - Physical proctoring
  - Camera monitoring
  - Secure exam environment

## Testing the Features

To test the lockdown features:
1. Log in as a student
2. Start taking an exam
3. Try to:
   - Press ESC (blocked)
   - Switch tabs (violation logged)
   - Press F12 (blocked)
   - Right-click (blocked)

## Future Enhancements

Potential additions:
- Webcam monitoring
- Screen recording
- AI-based cheating detection
- Multiple monitor detection
- Copy/paste prevention in answer fields
