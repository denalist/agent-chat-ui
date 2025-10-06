# Authentication Setup Guide

This guide will help you set up AWS Cognito authentication for the Property Agent Chat UI.

## Prerequisites

- AWS Account
- AWS CLI configured (optional but recommended)
- Node.js and pnpm installed

## Step 1: Create AWS Cognito User Pool

### Using AWS Console:

1. **Go to AWS Cognito Console**
   - Navigate to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
   - Click "Create user pool"

2. **Configure Sign-in Experience**
   - Choose "Cognito user pool"
   - Select "Email" as the sign-in option
   - Click "Next"

3. **Configure Security Requirements**
   - Set password policy (minimum 8 characters recommended)
   - Choose "No MFA" for simplicity (or enable if needed)
   - Click "Next"

4. **Configure Sign-up Experience**
   - Enable "Self-service sign-up"
   - Choose "Send email verification message"
   - Click "Next"

5. **Configure Message Delivery**
   - Choose "Send email with Cognito"
   - Click "Next"

6. **Integrate Your App**
   - Enter a user pool name (e.g., "property-agent-chat-users")
   - Click "Create user pool"

7. **Create App Client**
   - In your user pool, go to "App integration" tab
   - Click "Create app client"
   - Choose "Public client" (since this is a frontend app)
   - Uncheck "Generate client secret"
   - Enable "ALLOW_USER_SRP_AUTH" and "ALLOW_REFRESH_TOKEN_AUTH"
   - Click "Create app client"

8. **Get Your Configuration Values**
   - Note down your **User Pool ID** (format: `us-east-1_XXXXXXXXX`)
   - Note down your **App Client ID** (format: `xxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Note down your **AWS Region** (e.g., `us-east-1`)

### Using AWS CLI (Alternative):

```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name "property-agent-chat-users" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": false,
      "RequireLowercase": false,
      "RequireNumbers": false,
      "RequireSymbols": false
    }
  }' \
  --auto-verified-attributes email \
  --verification-message-template '{
    "DefaultEmailOption": "CONFIRM_WITH_CODE"
  }'

# Create app client (replace USER_POOL_ID with actual ID from previous command)
aws cognito-idp create-user-pool-client \
  --user-pool-id USER_POOL_ID \
  --client-name "property-agent-chat-client" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

## Step 2: Configure Environment Variables

1. **Create Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your Cognito values:**
   ```env
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

   **Note:** The Identity Pool ID is optional for basic authentication. You can leave it as a placeholder or create an Identity Pool if you need AWS service access.

## Step 3: Install Dependencies

The required dependencies are already installed:
- `aws-amplify`
- `@aws-amplify/ui-react`

## Step 4: Test the Authentication

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Navigate to your app** (usually `http://localhost:3000`)

3. **Test the flow:**
   - You should see the sign-in form
   - Click "Sign up" to create a new account
   - Enter your email and password
   - Check your email for the confirmation code
   - Enter the code to confirm your account
   - Sign in with your credentials
   - You should now see the Property Agent Chat interface

## Features Included

### Authentication Components:
- **SignInForm**: Email/username and password sign-in
- **SignUpForm**: User registration with email verification
- **ConfirmSignUpForm**: Email verification code entry
- **AuthContainer**: Main authentication wrapper
- **AuthGuard**: Route protection component
- **UserMenu**: User info and sign-out functionality

### Authentication Features:
- ✅ User registration with email verification
- ✅ Sign in with email/username and password
- ✅ Email verification code confirmation
- ✅ Resend verification code
- ✅ Protected routes (chat interface only accessible when authenticated)
- ✅ User session management
- ✅ Sign out functionality
- ✅ Loading states and error handling
- ✅ Responsive design

## Customization

### Styling
The authentication components use the existing UI components and follow the app's design system. You can customize:
- Colors in `tailwind.config.js`
- Component styles in the individual auth component files
- Layout in `AuthContainer.tsx`

### Configuration
You can modify the authentication behavior in:
- `src/lib/amplify-config.ts` - AWS Amplify configuration
- `src/providers/Auth.tsx` - Authentication context and logic

### Additional Features
To add more features, consider:
- Password reset functionality
- Social login (Google, Facebook, etc.)
- Multi-factor authentication
- User profile management
- Role-based access control

## Troubleshooting

### Common Issues:

1. **"User pool not found" error**
   - Verify your User Pool ID is correct
   - Ensure the AWS region matches

2. **"App client not found" error**
   - Verify your App Client ID is correct
   - Ensure the app client is associated with the user pool

3. **Email verification not working**
   - Check your email spam folder
   - Verify email delivery settings in Cognito
   - Ensure your email is verified in the user pool

4. **Environment variables not loading**
   - Ensure `.env.local` is in the project root
   - Restart the development server after changing environment variables
   - Verify variable names start with `NEXT_PUBLIC_`

### Debug Mode:
Add this to your `.env.local` for more detailed logging:
```env
NEXT_PUBLIC_DEBUG=true
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS settings in your Cognito app client for production domains
4. **Password Policy**: Enforce strong password policies in your user pool
5. **Rate Limiting**: Consider implementing rate limiting for authentication endpoints

## Production Deployment

For production deployment:

1. **Update CORS settings** in your Cognito app client to include your production domain
2. **Use HTTPS** for all authentication flows
3. **Set up proper error monitoring** for authentication failures
4. **Consider using AWS CloudFront** for better performance and security
5. **Implement proper logging** for authentication events

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your AWS Cognito configuration
3. Ensure all environment variables are set correctly
4. Check the AWS Cognito console for user pool and app client settings
