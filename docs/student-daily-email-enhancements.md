## Student Daily Email — Header/Footer Upgrade, Daily Quotes, and Character-Trait Challenges

### Goals
- Make header and footer more polished, warm, and kid-friendly for 5th graders.
- Add a deterministic "unique quote of the day" system that:
  - Treats Sunday as the start of the week and Thursday as the end of the week
  - Pays special attention to Thursday and the upcoming weekend
  - Emphasizes the monthly character trait (this month: Curiosity)
- Link Today's Challenge to one of 9 character traits; emphasize Curiosity this month.
- Preserve all current functionality, data handling, and exports.

### Constraints and Considerations
- Keep all logic and rendering client-safe (inline CSS, sanitize text, minimal HTML tags).
- Maintain compatibility with existing `buildSubject`, `buildHtml`, `buildText`, and wrapper.
- Avoid increasing email weight too much; stick with inline styles and emojis.
- Deterministic outputs per date for consistency (and testability).

---

## Visual Design Updates

### Header (Proposed)
- Brighter gradient and playful accent colors (still accessible):
  - Current gradient is fine but can lean slightly more playful while staying school-appropriate.
- Content layout:
  - Line 1: School name (bold, friendly font weight)
  - Line 2: Date badge
  - Optional: Student-first greeting line with emoji and small confetti accent
  - Optional: Small school logo/avatar on the right if available

### Footer (Proposed)
- Elements (top to bottom):
  - Friendly closing line (kid-positive, short): "Proud of your effort today—keep the positive streak going! 🌟"
  - Teacher line: "Teacher: {teacherName}"
  - Optional: School motto or character-trait reminder (this month's Curiosity badge)
  - Preferences/help: "You can adjust your email preferences in your portal."
  - Optional small-print: "You're receiving this because your guardian opted in." (if appropriate)

---

## Deterministic Daily Quote System

### Requirements
- One quote per calendar day (deterministic for that day).
- Sunday is the first day of the week.
- Thursday should include a nod to planning for the weekend; weekend-aware copy for Thu/Fri/Sat.
- Monthly theme bias: Curiosity content should surface more frequently this month.

### Sources and Pools
- General kid-safe motivation pool
- Curiosity-centric pool (month emphasis)
- Weekday-specific pool (Sun..Sat)
- Thursday/weekend-aware pool (Thu preview, Fri "finish strong", Sat "weekend wonder")

### Selection Algorithm (Deterministic)
1. Compute: `weekday = date.getDay()` where Sunday=0 .. Saturday=6.
2. Compute: `doy = dayjs(date).dayOfYear()`.
3. Start with a base pool = general + weekday-specific.
4. If Thursday (4) or Fri (5)/Sat (6), blend in weekend-aware quotes.
5. If current month's trait is Curiosity, upweight/intersperse curiosity quotes (e.g., 50% chance pick from Curiosity pool first, else fallback to base).
6. Deterministic pick: `index = (doy + month*13) % pool.length`. Optionally add a stable salt to vary by student if desired: `stableHash(studentId) % pool.length`.
7. Fallback to general pool if selected is missing.

### Pseudocode
```text
function getDailyQuote({ date, studentId, monthlyTrait = 'Curiosity' }) {
  const weekday = date.getDay(); // 0..6, Sun start
  const doy = dayjs(date).dayOfYear();
  let pool = [...generalQuotes, ...weekdayPools[weekday]];
  if (weekday === 4 || weekday === 5 || weekday === 6) {
    pool = pool.concat(weekendAwareQuotes);
  }
  if (monthlyTrait === 'Curiosity' && Math.floor((doy % 2) === 0)) {
    pool = curiosityQuotes.concat(pool); // front-load curiosity
  }
  const salt = studentId ? stableHash(studentId) : 0; // optional per-student variation
  const index = (doy + (date.getMonth() + 1) * 13 + salt) % pool.length;
  return pool[index];
}
```

### Examples (sample copy)
- Sunday (0): "Fresh start, new week—one curious question can lead to big discoveries. 🌟"
- Thursday (4): "Weekend's coming! Plan one mini curiosity-quest to try. 🔎✨"
- Friday (5): "Finish strong—then celebrate with a tiny experiment this weekend! 🧪🎉"
- Saturday (6): "Weekends are perfect for wonder. Notice something new today. 👀"

---

## Monthly Character Trait Settings and Trait-Linked Quotes/Challenges

### Goal
- Create a school-level character traits system where each trait is assigned to a month, and quotes/challenges are automatically selected based on the current month's trait.

### Settings Placement
- New component in `@Settings.js`: `CharacterTraitsManager` for creating/managing school-level character traits.
- Each character trait has:
  - Name (from the 9 traits: Compassion, Service, Courage, Persistence, Humility, Discernment, Curiosity, Kindness, Respect)
  - Assigned month (1-12)
  - Associated quotes (comma-separated)
  - Associated challenges (comma-separated)
- Storage: `schools/{schoolId}/characterTraits/{traitId}` collection.
- Access: Anyone with the same email domain can access the school's character traits.

### Daily Email Preferences (UI)
- Remove the trait-specific fields from `DailyEmailPreferences.jsx`.
- The system automatically selects quotes/challenges based on the current month's trait from the school's character traits collection.
- Fallback: If no school-level traits are configured, use built-in defaults.

### Template/Generator Integration
- Quote generation:
  - Primary pool: Current month's trait quotes from school collection
  - Fallback: Built-in pools (weekday + weekend-aware + current month bias)
- Challenge generation:
  - Primary pool: Current month's trait challenges from school collection with weekday rules
  - Fallback: Built-in trait challenge pools (by trait); fallback to generic
- Deterministic selection remains date-seeded; Sunday=0; Thursday/weekend awareness preserved.

### Optional Future Enhancements
- Allow per-weekday overrides per trait (e.g., Thursday-only prompts).
- Allow per-class overrides of character traits.

---

## Character-Trait Challenges (9 traits)

### AMLY Character Traits System
- **3 Primary Traits** with **9 Secondary Traits**:

#### 1. Confidence: Asserting my unique identity
- **Humility**: Inner humility that overflows into purpose
- **Purpose**: Understanding our special calling
- **Courage**: Extending confidence to bold action

#### 2. Hope: Believing good comes from bad  
- **Persistence**: Inner persistence that overflows into compassion
- **Compassion**: Caring for others with understanding
- **Service**: Extending hope through helping others

#### 3. Wisdom: Knowing what is right
- **Curiosity**: Inner curiosity that overflows into connection
- **Connection**: Building meaningful relationships
- **Discernment**: Applying truth carefully to daily decisions

### Monthly Assignment
- Each primary trait (Confidence, Hope, Wisdom) gets assigned to 4 months in the school settings
- The system automatically selects the current month's primary trait and its secondary traits for quotes and challenges
- If no traits are configured for the current month, fall back to built-in defaults

### Challenge Generator
- Base behavior:
  - Determine `currentTraitOfMonth` from school character traits collection based on current month
  - Select from that trait's age-appropriate challenge pool
  - On Thursday, choose a "plan your weekend" style challenge aligned to the trait (e.g., plan a curiosity activity)
  - On Friday/Saturday, choose a "weekend activity" style challenge aligned to the trait

### Sample Curiosity Challenges (5th grade tone)
- Ask one "why" question in class and share your idea. ❓
- Find 3 new words while reading and use one in a sentence. 📖
- Try a short "what if" brainstorm about a topic you love. 💡
- Observe something at home/school and write one thing you wonder. 👀
- Teach a friend one cool fact you learned and ask their question. 🤝
- Draw a tiny diagram of something you're curious about. ✍️
- Find a safe mini-experiment to try (with an adult's help). 🧪
- Read for 10 minutes and jot down 2 curious thoughts. 📝
- Plan a weekend curiosity mission (Thu): list materials and 1 step. 🗺️
- Weekend curiosity quest (Fri/Sat): Try it and reflect on 1 discovery. 🌟

### Deterministic Selection (like quotes)
```text
function getDailyChallenge({ date, monthlyTrait = 'Curiosity' }) {
  const weekday = date.getDay(); // Sunday=0
  let pool = traitPools[monthlyTrait] || genericChallenges;
  if (weekday === 4) pool = weekendPlanChallenges[monthlyTrait] || pool; // Thu plan
  if (weekday === 5 || weekday === 6) pool = weekendDoChallenges[monthlyTrait] || pool; // Fri/Sat do (weekend = Friday+Saturday)
  const doy = dayjs(date).dayOfYear();
  const index = (doy + (date.getMonth() + 1) * 7) % pool.length;
  return pool[index];
}
```

---

## Implementation Plan

### 1. Character Traits Manager Component
- New component: `src/components/settings/CharacterTraitsManager.jsx`
- Features:
  - Create new character trait with name, month assignment, quotes, and challenges
  - Edit existing traits
  - Delete traits
  - View all traits in a table/grid
- Storage: `schools/{schoolId}/characterTraits/{traitId}` collection
- Access control: Based on user's email domain matching school domain

### 2. Settings Integration
- Add `CharacterTraitsManager` to `src/pages/Settings.js`
- Position it appropriately in the settings grid

### 3. Daily Email Preferences Updates
- Remove trait-specific fields from `DailyEmailPreferences.jsx`
- Keep general custom quotes as fallback
- System automatically uses current month's trait from school collection

### 4. Template Updates
- Update `functions/src/templates/studentDailyUpdateEmail.js` to:
  - Query school character traits collection for current month's trait
  - Use trait-specific quotes and challenges
  - Fall back to built-ins if no school traits configured

### 5. Data Flow
1. Teacher configures character traits in Settings → Character Traits Manager
2. System stores traits in `schools/{schoolId}/characterTraits/{traitId}`
3. When building student emails, system queries current month's trait
4. Uses trait-specific quotes/challenges with weekday logic (Sunday=0, weekend=Friday+Saturday)
5. Falls back to built-ins if no school configuration

---

## Open Questions (Please confirm)
1. **9 Traits Confirmed**: Compassion, Service, Courage, Persistence, Humility, Discernment, Curiosity, Kindness, Respect
2. **Weekend Definition**: Friday+Saturday (Sunday=0, Thursday=plan, Fri/Sat=do)
3. **Storage**: School-level collection `schools/{schoolId}/characterTraits/{traitId}` - correct?
4. **Access Control**: Users with same email domain can access school traits - correct?
5. **Month Assignment**: Each trait gets assigned to 1-12 months, system auto-selects current month - correct?
6. **Quotes Scope**: Same quote/challenge per day for all students, or allow per-student variation?
7. **Fallback**: Keep general custom quotes field in DailyEmailPreferences as backup, or remove entirely?
8. **UI Flow**: In CharacterTraitsManager, should quotes/challenges be comma-separated text fields or individual add/remove lists?
9. **Branding**: Any colors/logo/mascot for header or compliance text for footer?
10. **Localization**: English-only for now?


