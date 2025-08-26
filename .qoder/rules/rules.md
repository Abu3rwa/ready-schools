---
description: Productivity-focused development rules for teacher-kit project
globs: 
alwaysApply: true
---

## 🚀 Productivity-First Development

### Core Principles
- **Speed over perfection**: Deliver working solutions quickly
- **No testing**: Skip tests unless explicitly requested
- **Reuse patterns**: Leverage existing codebase patterns
- **Minimal changes**: Fix issues with targeted changes, avoid rewrites

### React/JavaScript Standards

**Good Examples:**
```javascript
// ✅ Use functional components with hooks
const MyComponent = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const items = data || []; // Fallback for null/undefined
  // ...
};

// ✅ Handle null/undefined gracefully
const safeData = preferences || {};
const normalizedPrefs = normalizePreferences(userPrefs || {}, 'parent');
```

**Follow existing patterns:**
- Use Material-UI components and sx prop styling
- Follow Context API patterns (AuthContext, StudentContext, etc.)
- Use existing service layer in `src/services/`
- Maintain responsive design with breakpoints: `{ xs: 1, sm: 2, md: 3 }`

### Error Prevention

**Always add null checks:**
```javascript
// ✅ Good
const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown';
const items = data?.items || [];
const config = userConfig || {};

// ❌ Avoid
const studentName = `${student.firstName} ${student.lastName}`; // Can crash
```

### File Organization
- Keep components under 300 lines
- Use existing directory structure in `src/components/`
- Follow naming: PascalCase for components, camelCase for utilities
- Import order: React, MUI, contexts, services, utils

### Feature Modularization

When creating a new feature, always organize it into a proper modular structure:

**1. Main Page** (`src/pages/`):
```javascript
// src/pages/FeatureName.jsx
import React from 'react';
import FeatureContainer from '../components/featureName/FeatureContainer';

const FeatureName = () => {
  return <FeatureContainer />;
};

export default FeatureName;
```

**2. Component Folder** (`src/components/featureName/`):
```
src/components/featureName/
├── FeatureContainer.jsx      // Main container component
├── FeatureList.jsx          // List/table component
├── FeatureForm.jsx          // Form component
├── FeatureCard.jsx          // Individual item component
├── FeatureDialog.jsx        // Modal/dialog component
└── index.js                 // Export barrel
```

**3. Service Layer** (`src/services/`):
```javascript
// src/services/featureNameService.js
import { db } from '../firebase';

export const getFeatures = async () => { /* ... */ };
export const createFeature = async (data) => { /* ... */ };
export const updateFeature = async (id, data) => { /* ... */ };
export const deleteFeature = async (id) => { /* ... */ };
```

**4. Context (if needed)** (`src/contexts/`):
```javascript
// src/contexts/FeatureNameContext.js
import React, { createContext, useContext } from 'react';

const FeatureNameContext = createContext();
export const useFeatureName = () => useContext(FeatureNameContext);
export const FeatureNameProvider = ({ children }) => { /* ... */ };
```

**5. Utils (if needed)** (`src/utils/`):
```javascript
// src/utils/featureNameUtils.js
export const validateFeatureData = (data) => { /* ... */ };
export const formatFeatureDisplay = (feature) => { /* ... */ };
```

**Modularization Rules:**
- **Always create a dedicated folder** in `components/` for each feature
- **Use barrel exports** (index.js) to simplify imports
- **Separate concerns**: Container → Form → List → Card → Dialog
- **Create service layer** for all Firebase/API operations
- **Add context only** if state needs to be shared across components
- **Keep utils separate** for reusable helper functions
- **Follow naming convention**: featureName (camelCase for folders), FeatureName (PascalCase for components)

### Communication Style
- Get straight to implementation
- Use parallel tool calls for efficiency
- Focus on specific problems, not architectural rewrites
- Provide working code with minimal explanation

### Interactive Task Loop

1. **Check `userinput.py`** exists in root:
   ```python
   # userinput.py
   user_input = input("prompt: ")
   ```

2. **Workflow:**
   - Perform assigned tasks
   - Run: `python userinput.py`
   - Read user input
   - Continue based on input
   - Stop when user enters "stop"
