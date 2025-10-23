import { Configuration, LogLevel } from '@azure/msal-browser';

// MSAL configuration for Azure AD authentication
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // Store tokens in session storage
    storeAuthStateInCookie: false, // Set to true for IE 11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

// Scopes for API access
export const loginRequest = {
  scopes: ['User.Read'], // Microsoft Graph API
};

// Scopes for SmartProof API
export const apiRequest = {
  scopes: [`api://${import.meta.env.VITE_AZURE_AD_CLIENT_ID}/.default`],
};
