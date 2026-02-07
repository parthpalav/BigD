# Firebase Service Account Setup

To enable Firebase Cloud Messaging for push notifications, you need to add your Firebase service account credentials here.

## Steps to Get Firebase Service Account Credentials:

1. **Go to Firebase Console**: https://console.firebase.google.com/

2. **Select your project**: `orion-81737` (orion-dep)

3. **Navigate to Project Settings**:
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"

4. **Go to Service Accounts tab**:
   - Click on "Service accounts" tab
   - Click "Generate new private key" button
   - Confirm by clicking "Generate key"

5. **Download the JSON file**:
   - A JSON file will be downloaded (something like `orion-81737-firebase-adminsdk-xxxxx.json`)

6. **Save it here**:
   - Rename the file to `firebase-credentials.json`
   - Place it in this `config/` directory
   - Path should be: `/Users/arnav/Desktop/BigD/server/config/firebase-credentials.json`

7. **Update .env** (if not already set):
   ```
   FIREBASE_PROJECT_ID=orion-81737
   ```

## Security Note:
- **NEVER commit `firebase-credentials.json` to Git**
- It's already in `.gitignore`
- Keep this file secure and private

## Verify Setup:
Once you've added the file, the backend will automatically load it on startup.
Check the logs for: `✓ Firebase initialized`
