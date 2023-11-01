// Copyright 2016 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//'use strict';

const {google} = require('googleapis');

// const {authenticate} = require('@google-cloud/local-auth');

// Load the client credentials from your JSON file client_secret_apps_google  in the public directory
const credentials = require('../middleware/client_secret_apps_google.json');

// Create an OAuth 2.0 client using the loaded credentials
const oAuth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[1]
);


/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
google.options({auth: oAuth2Client});




export async function GetGoogleDriveAuthorization() {
   
const drive = google.drive({
    version: 'v3',
    auth: oAuth2Client
  });
  return drive;
}