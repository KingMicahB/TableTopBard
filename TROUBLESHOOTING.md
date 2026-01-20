# Troubleshooting npm install Issues

If `npm install` appears stuck, try these solutions:

## Quick Fixes

### 1. Clear npm cache
```powershell
npm cache clean --force
```

### 2. Try installing with verbose output to see where it's stuck
```powershell
cd backend
npm install --verbose
```

### 3. Use legacy peer deps (if peer dependency conflicts)
```powershell
npm install --legacy-peer-deps
```

### 4. Try a different registry (if npm registry is slow)
```powershell
npm install --registry https://registry.npmjs.org/
```

### 5. Install packages one at a time to identify problematic package
```powershell
npm install express
npm install cors
npm install dotenv
npm install multer
npm install openai
```

## Common Causes

1. **Network Issues**: Slow or unstable internet connection
   - Solution: Wait longer, or use a different network

2. **Antivirus/Firewall**: Blocking npm operations
   - Solution: Temporarily disable or add exception for npm/node

3. **npm Version**: Older npm versions can have issues
   - Solution: Update npm: `npm install -g npm@latest`

4. **Corrupted Cache**: npm cache might be corrupted
   - Solution: `npm cache clean --force`

5. **Large Dependencies**: Some packages take time to download
   - Solution: Be patient, check network activity

## Alternative: Use yarn

If npm continues to have issues, you can use yarn instead:

```powershell
# Install yarn globally
npm install -g yarn

# Then use yarn instead
cd backend
yarn install

cd ../frontend
yarn install
```

## Check if it's actually stuck

Sometimes npm install appears stuck but is actually working. Check:
- Network activity in Task Manager
- CPU usage (should be active)
- Disk activity (should be writing files)

If there's no activity for 5+ minutes, it's likely stuck.
