# Rule-Ette - Fantasy Rule Swap Game

A local web-based interface for running fantasy league rule swap games using a **Yankee Swap** mechanic with spin-the-wheel draft ordering and strategic rule selection.

## Features

- **Individual Draft Ordering**: Spin the wheel for each team to determine their draft position (1-9)
- **Yankee Swap Rule Selection**: Players can submit new rules or swap existing rules from other teams
- **Timer System**: 2-minute countdown timer per turn with pause/resume functionality
- **Final Pick Advantage**: The #1 draft pick gets the final opportunity to swap any rule
- **Rule History Tracking**: Complete log of all team actions and rule ownership changes
- **Dark Mode Interface**: Night-friendly color scheme for extended gameplay
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

### 1. Setup Draft Order
1. Open `index.html` in any modern web browser
2. Enter team names in the text area (one per line, 2-9 teams)
3. Click "Setup Draft Order" to initialize the teams

### 2. Determine Draft Positions
1. Click "Spin for Next Team" to randomly assign each team a draft position
2. The wheel will animate and show which position each team receives
3. Continue spinning until all teams have been assigned positions 1-9
4. Click "Start Yankee Swap" when draft order is complete

### 3. Yankee Swap Gameplay
- **Turn Order**: Teams select rules in draft order (1st, 2nd, 3rd, etc.)
- **Timer**: Each team has 2 minutes to make their decision (pause/resume available)
- **Rule Actions**:
  - **Submit New Rule**: Enter a new rule in the text area and click "Submit New Rule"
  - **Swap for Existing Rule**: Click "Swap for This Rule" on any available rule
- **Rule Ownership**: Rules show current owner and original creator
- **History**: All actions are logged in the rule selection history

### 4. Final Pick Phase
1. After all teams have made their initial selections, the **#1 draft pick** gets a final turn
2. They can either:
   - **Swap for any existing rule** (taking it from another team)
   - **Keep their current rule** (if they have one)
3. This gives the first picker a strategic advantage, just like in Yankee Swap gift exchanges

### 5. Game Completion
- Final rule assignments are displayed showing which team owns each rule
- Complete history shows all swaps and rule submissions
- Teams end up with the rules they own at the end of the game

## Yankee Swap Strategy Tips

- **#1 Draft Pick Strategy**: Submit a rule you like initially, knowing you'll get the final pick to potentially swap for the best rule
- **Mid-Round Strategy**: Consider submitting appealing rules early to see if others want to swap for them
- **Late-Round Strategy**: Submit rules strategically or swap for rules that haven't been taken yet
- **Final Pick**: The #1 pick should carefully consider all available rules before making their final decision

## Technical Details

### File Structure
```
rule-ette/
├── index.html          # Main HTML interface
├── style.css           # Dark mode styling and animations
├── script.js           # Yankee Swap game logic and functionality
└── README.md           # This file
```

### Customization

#### Timer Duration
To change the timer duration, edit the `timerDuration` property in `script.js`:
```javascript
this.timerDuration = 120; // Change to desired seconds
```

#### Team Names
Teams can be entered through the UI, or you can modify the default placeholder text in `index.html`.

#### Styling
The dark mode color scheme, fonts, and layout can be customized in `style.css`. The interface uses CSS Grid for responsive layout.

## Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Development Notes

- Built with vanilla JavaScript (no frameworks required)
- Uses CSS Grid and Flexbox for responsive layout
- Implements CSS animations for wheel spinning effect
- Dark mode optimized for night-time gameplay
- Local storage not implemented - game state resets on page reload
- All functionality is client-side - no server required

## Future Enhancements

- [ ] Save/load game state
- [ ] Configurable timer duration in UI
- [ ] Sound effects for timer and actions
- [ ] Export rule history to PDF/text
- [ ] Multiple rounds of rule swapping
- [ ] Team statistics tracking
- [ ] Light/dark mode toggle

## License

This project is open source and available under the MIT License.