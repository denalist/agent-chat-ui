import { Amplify } from 'aws-amplify';

// Only run configuration on client side
if (typeof window !== 'undefined') {
  // Validate required environment variables
  const requiredEnvVars = {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
  };

  // Check if all required environment variables are present
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    console.error('Please check your .env.local file and ensure all Cognito configuration variables are set.');
  }

  const amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId: requiredEnvVars.userPoolId!,
        userPoolClientId: requiredEnvVars.userPoolClientId!,
        // Include client secret if it exists
        ...(process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_SECRET && {
          userPoolClientSecret: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_SECRET,
        }),
        // Only include identityPoolId if it's not a placeholder
        ...(process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID && 
            !process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID.includes('xxxxxxxx') && {
          identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
        }),
        loginWith: {
          email: true,
          username: false,
          phone: false,
        },
        signUpVerificationMethod: 'code' as const,
      },
    },
  };

  // Only configure Amplify if we have the required variables
  if (missingVars.length === 0) {
    Amplify.configure(amplifyConfig);
    console.log('AWS Amplify configured successfully on client side');
  } else {
    console.error('AWS Amplify configuration skipped due to missing environment variables');
  }
}
