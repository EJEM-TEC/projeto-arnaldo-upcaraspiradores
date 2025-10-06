# Database Integration Setup Guide

## 1. Create Your Database Table in Supabase

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project at https://app.supabase.com
2. Go to **Table Editor** in the left sidebar

### Step 2: Create the Users Table
1. Click **"New table"**
2. Configure the table:
   - **Name**: `users` (or whatever you prefer)
   - **Description**: "User profiles table"

### Step 3: Add Columns
Add these columns in order:

| Column Name | Type | Default Value | Nullable | Primary Key |
|-------------|------|---------------|----------|-------------|
| `id` | `uuid` | - | No | Yes |
| `created_at` | `timestamptz` | `now()` | No | No |
| `email` | `text` | - | No | No |
| `name` | `text` | - | No | No |

### Step 4: Set Up Row Level Security (RLS)
1. After creating the table, go to **Authentication > Policies**
2. Click **"New Policy"** for your `users` table
3. Create these policies:

**Policy 1: Users can view their own data**
- **Policy name**: "Users can view own profile"
- **Operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**: `auth.uid() = id`

**Policy 2: Users can update their own data**
- **Policy name**: "Users can update own profile"
- **Operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**: `auth.uid() = id`

**Policy 3: Allow inserts for new users**
- **Policy name**: "Allow user profile creation"
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**: `auth.uid() = id`

## 2. Update Your Code

### Step 1: Update Table Name (if different)
If your table is not named `users`, update the table name in `src/lib/database.ts`:

```typescript
// Change this line in all functions:
.from('users') // Replace 'users' with your actual table name
```

### Step 2: Test the Integration
1. Start your app: `npm run dev`
2. Go to http://localhost:3000
3. Sign up with a new email
4. Check your Supabase dashboard under **Table Editor** to see the new user record

## 3. How It Works

### Automatic User Creation
When a user signs up:
1. Supabase Auth creates the authentication record
2. Our code automatically creates a database record with:
   - `id`: User's UUID from auth
   - `created_at`: Timestamp from auth
   - `email`: User's email
   - `name`: Extracted from email (before @)

### Database Functions Available
- `createUserProfile()`: Creates new user record
- `getUserProfile()`: Fetches user data
- `updateUserProfile()`: Updates user data

## 4. Example Usage

### Get User Profile in a Component
```typescript
import { getUserProfile } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(({ data }) => {
        setProfile(data);
      });
    }
  }, [user]);

  return <div>{profile?.name}</div>;
}
```

### Update User Name
```typescript
import { updateUserProfile } from '@/lib/database';

const handleUpdateName = async (newName: string) => {
  if (user) {
    await updateUserProfile(user.id, { name: newName });
  }
};
```

## 5. Troubleshooting

### "relation does not exist" Error
- Make sure your table name matches exactly in the code
- Check that the table was created successfully in Supabase

### "permission denied" Error
- Verify RLS policies are set up correctly
- Make sure the user is authenticated when making requests

### "duplicate key" Error
- This happens if a user tries to sign up twice
- The code handles this gracefully and won't break the signup flow

## 6. Optional Enhancements

### Add More Fields
You can add more columns to your table:
- `avatar_url` (text)
- `phone` (text)
- `last_login` (timestamptz)
- `is_active` (boolean)

### Update the Database Service
Add corresponding functions in `src/lib/database.ts` for any new fields.

### Add Validation
Consider adding email validation or name requirements in your signup form.

## 7. Production Considerations

### Database Indexes
Add indexes for frequently queried fields:
```sql
CREATE INDEX idx_users_email ON users(email);
```

### Data Migration
If you have existing users, you might need to migrate them to the new table structure.

### Monitoring
Set up monitoring for database operations and errors in production.
