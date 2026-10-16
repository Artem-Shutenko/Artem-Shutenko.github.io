# Privacy Policy for Exportify Browser Extension

**Effective Date:** October 16, 2026

## 1. Overview
This Privacy Policy describes how the **Exportify Browser Extension** ("the Extension", "we", "our") handles your personal data and information when you use our Chrome Extension to export your Spotify playlists into CSV format.

We are committed to protecting your privacy and ensuring transparency in how data is processed.

## 2. Information We Access
To provide the core functionality of exporting playlists, the Extension requests read-only access to your Spotify account using official Spotify Web API endpoints. The data accessed includes:
* **Account Credentials & Tokens:** Access tokens and refresh tokens generated via Spotify OAuth PKCE authorization.
* **User Profile Data:** Basic account information (such as User ID) to identify user sessions.
* **Playlist Information:** Names, track details, album titles, artist names, duration, and track metadata of your public and private playlists.

## 3. How Your Information Is Used
* All fetched playlist data is processed **locally inside your browser** solely for the purpose of generating downloadable CSV files.
* Your access tokens are securely stored on your local machine using Chrome's `chrome.storage.local` API and are only used to authenticate direct API requests to Spotify.

## 4. Data Sharing and Storage
* **No Remote Storage:** We do NOT collect, store, transmit, or process your personal data, tokens, or playlist information on any external server or third-party database.
* **No Third-Party Analytics:** We do NOT use any tracking scripts, analytics tools, or advertising identifiers.
* **No Selling of Data:** We never sell, rent, or trade any user data to third parties.

## 5. Third-Party Services
The Extension interacts directly with the official **Spotify Web API**. Your interactions with Spotify services are governed by [Spotify's Privacy Policy](https://www.spotify.com/legal/privacy-policy/).

## 6. Data Retention and Revocation
* You can remove all locally stored extension data at any time by clearing your browser cache or uninstalling the extension.
* You can revoke the Extension’s access to your Spotify account at any time by visiting your [Spotify Account Apps Page](https://www.spotify.com/account/apps/).

## 7. Contact Us
If you have any questions or concerns regarding this Privacy Policy, feel free to contact us via our official repository issue tracker.
